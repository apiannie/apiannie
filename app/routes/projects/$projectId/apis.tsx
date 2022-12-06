import Tree, {
  ItemId,
  moveItemOnTree,
  mutateTree,
  RenderItemParams,
  TreeData,
  TreeDestinationPosition,
  TreeSourcePosition,
} from '@atlaskit/tree';
// @ts-ignore
import { resetServerContext } from 'react-beautiful-dnd-next';
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spacer,
  Text,
  Tooltip,
  UnorderedList,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { ProjectUserRole, RequestMethod, RequestParam } from '@prisma/client';
import { ActionArgs, redirect } from '@remix-run/node';
import {
  Link as RemixLink,
  useCatch,
  useFetcher,
  useMatches,
} from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import { useEffect, useState } from 'react';
import {
  BsFillCaretDownFill,
  BsFillCaretRightFill,
  BsFolder2Open,
} from 'react-icons/bs';
import {
  FiFilePlus,
  FiFolder,
  FiFolderPlus,
  FiTrash,
} from 'react-icons/fi';
import { Outlet, useParams } from 'react-router-dom';
import { ValidatedForm, validationError } from 'remix-validated-form';
import invariant from 'tiny-invariant';
import { z } from 'zod';
import {
  createApi,
  createGroup,
  deleteApi,
  deleteGroup,
  updateApi,
  updateGroup,
} from '~/models/api.server';
import { Api, checkAuthority, Group, Project } from '~/models/project.server';
import { RequestMethods } from '~/models/type';
import { requireUserId } from '~/session.server';
import { PathInput } from '~/ui';
import FormCancelButton from '~/ui/Form/FormCancelButton';
import FormHInput from '~/ui/Form/FormHInput';
import FormInput from '~/ui/Form/FormInput';
import FormModal from '~/ui/Form/FormModal';
import FormSubmitButton from '~/ui/Form/FormSubmitButton';
import { httpResponse, parsePath, useUrl } from '~/utils';
import TreeBuilder from '~/utils/treeBuilder';
import { ProjecChangeButton } from '../$projectId';

export const handle = {
  sideNav: <SideNav />,
};

enum Action {
  NEW_GROUP = 'NEW_GROUP',
  NEW_API = 'NEW_API',
  UPDATE_API = 'UPDATE_API',
  UPDATE_GROUP = 'UPDATE_GROUP',
  DELETE_API = 'DELETE_API',
  DELETE_GROUP = 'DELETE_GROUP',
}

export const action = async ({ request, params }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let { projectId } = params;
  invariant(projectId);

  if (!(await checkAuthority(userId, projectId, ProjectUserRole.WRITE))) {
    return httpResponse.Forbidden;
  }

  switch (formData.get('_action')) {
    case Action.NEW_GROUP:
      return await newGroupAction(formData, projectId);
    case Action.UPDATE_GROUP:
      return await updateGroupAction(formData);
    case Action.NEW_API:
      return await newApiAction(formData, projectId);
    case Action.UPDATE_API:
      return await updateApiAction(formData);
    case Action.DELETE_API:
      return await deleteApiAction(formData);
    case Action.DELETE_GROUP:
      return await deleteGroupAction(formData);

    default:
      console.info('_action:', formData.get('_action'));
      return httpResponse.NotFound;
  }
};

const updateApiAction = async (formData: FormData) => {
  const result = await withZod(
    z.object({
      id: z.string().min(1, 'id is required'),
      groupId: z.string(),
      data: z.any(),
    })
  ).validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  return await updateApi(result.data.id, {
    groupId: result.data.groupId,
    data: result.data.data,
  });
};

const newGroupAction = async (formData: FormData, projectId: string) => {
  const result = await newGroupValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { parentId, name } = result.data;
  let group = await createGroup({
    parentId: parentId,
    projectId: projectId,
    name,
  });

  return redirect(`/projects/${group.projectId}/apis/groups/${group.id}`);
};

const updateGroupAction = async (formData: FormData) => {
  const result = await withZod(
    z.object({
      id: z.string().min(1, 'id is required'),
      parentId: z.string(),
      name: z.string(),
      description: z.string(),
    })
  ).validate(formData);
  if (result.error) {
    return validationError(result.error);
  }
  const { id, name, description, parentId } = result.data;
  return await updateGroup({ id, name, description, parentId });
};

const newApiAction = async (formData: FormData, projectId: string) => {
  const result = await newApiValidator.validate(formData);
  if (result.error) {
    return validationError(result.error);
  }

  const { name, path, method, groupId } = result.data;

  let { params } = parsePath(path);

  let api = await createApi(projectId, groupId, {
    name,
    path,
    method,
    pathParams: params.map<RequestParam>((param) => ({
      name: param,
      example: '',
      description: '',
      isRequired: true,
      type: 'STRING',
    })),
  });

  return redirect(`/projects/${projectId}/apis/details/${api.id}`);
};

export const deleteApiAction = async (formData: FormData) => {
  let id = formData.get('id')?.toString();
  let apiId = formData.get('apiId')?.toString();
  if (!id) {
    return httpResponse.BadRequest;
  }
  let url = formData.get('url')?.toString() ?? '/';
  let api = await deleteApi(id);
  if (apiId === id) {
    if (api?.groupId) {
      return redirect(`/projects/${api.projectId}/apis/groups/${api.groupId}`);
    } else if (api?.projectId) {
      return redirect(`/projects/${api.projectId}/apis`);
    } else {
      return redirect(`/projects`);
    }
  }
  return redirect(url);
};

export const deleteGroupAction = async (formData: FormData) => {
  let id = formData.get('id')?.toString();
  let apiId = formData.get('apiId')?.toString();
  let groupId = formData.get('groupId')?.toString();
  if (!id) {
    return httpResponse.BadRequest;
  }
  let url = formData.get('url')?.toString() ?? '/';

  let data = await deleteGroup(id);

  if (!data) {
    return httpResponse.BadRequest;
  }

  let { group, groupsToDelete, apisToDelete } = data;

  if (
    (groupId && groupsToDelete.indexOf(groupId) !== -1) ||
    (apiId && apisToDelete.indexOf(apiId) !== -1)
  ) {
    if (group.parentId) {
      return redirect(
        `/projects/${group.projectId}/apis/groups/${group.parentId}`
      );
    } else {
      return redirect(`/projects/${group.projectId}/apis`);
    }
  }

  return redirect(url);
};

function SideNav() {
  const groupModal = useDisclosure();
  const apiModal = useDisclosure();

  return (
    <Grid templateRows="50px 40px minmax(0, 1fr)" h="100vh" overflowX={'auto'}>
      <ProjecChangeButton />
      <GridItem>
        <HStack px={2}>
          <Heading ml="2" fontWeight={'500'} size={'sm'} color="gray.400">
            APIs
          </Heading>
          <Spacer />
          <Box>
            {/* <Tooltip label="Clone">
             <IconButton
             aria-label="clone"
             icon={<FiCopy />}
             variant="ghost"
             colorScheme="gray"
             />
             </Tooltip> */}
            <Tooltip label="New group">
              <IconButton
                aria-label="add group"
                icon={<FiFolderPlus />}
                variant="ghost"
                colorScheme="gray"
                onClick={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.blur();
                  }
                  groupModal.onOpen();
                }}
              />
            </Tooltip>
            <NewGroupModal
              isOpen={groupModal.isOpen}
              onClose={groupModal.onClose}
            />
            <Tooltip label="New Api">
              <IconButton
                aria-label="add api"
                icon={<FiFilePlus />}
                variant="ghost"
                colorScheme="gray"
                onClick={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.blur();
                  }
                  apiModal.onOpen();
                }}
              />
            </Tooltip>
            <NewApiModal isOpen={apiModal.isOpen} onClose={apiModal.onClose} />
          </Box>
        </HStack>
        <Divider />
      </GridItem>
      <GridItem overflowY={'auto'}>
        <SideNavContent />
      </GridItem>
    </Grid>
  );
}

const newGroupValidator = withZod(
  z.object({
    name: z.string().min(1, 'group name is required'),
    parentId: z.string().optional(),
  })
);

const NewGroupModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: (data?: any) => void;
}) => {
  const params = useParams();
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={newGroupValidator}
      replace
      method="post"
      size="lg"
      action={`/projects/${params.projectId}/apis`}
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>New Group</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormInput
            name="name"
            label="Name"
            placeholder="Group name"
            autoComplete="off"
          />
          <input
            name="parentId"
            value={params.groupId || undefined}
            type="hidden"
          />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_GROUP}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};

const newApiValidator = withZod(
  z.object({
    name: z.string().trim().min(1, 'api name is required'),
    path: z.string().trim().min(1, 'path is required'),
    method: z.enum(RequestMethods),
    groupId: z.string().trim().optional(),
  })
);

export const NewApiModal = ({
  isOpen,
  onClose,
}: {
  isOpen: ModalProps['isOpen'];
  onClose: ModalProps['onClose'];
}) => {
  const matches = useMatches();
  const params = useParams();
  const gray = useColorModeValue('gray.200', 'gray.700');
  let groupId = '';
  if (params.groupId) {
    groupId = params.groupId;
  } else if (params.apiId) {
    groupId = matches?.[3].data?.api?.groupId;
  }

  let labelWidth = '60px';
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      validator={newApiValidator}
      replace
      method="post"
      size="xl"
      action={`/projects/${params.projectId}/apis`}
    >
      <ModalOverlay />

      <ModalContent>
        <ModalHeader>New Api</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={5}>
            <FormHInput
              labelWidth={labelWidth}
              name="name"
              label="Name"
              size="sm"
              as={Input}
              autoComplete="off"
            />
            <FormHInput
              labelWidth={labelWidth}
              name="path"
              label="Path"
              as={PathInput}
              autoComplete="off"
              size="sm"
            />
            <Flex width={'full'} pl={labelWidth} flexDir={'row'}>
              <UnorderedList fontSize={'sm'}>
                <ListItem>
                  The API path starts with{' '}
                  <Text borderRadius={4} px={1} as="span" bg={gray}>
                    /
                  </Text>
                </ListItem>
                <ListItem>
                  Use curly braces to indicate Path Params, such as
                  <Text borderRadius={4} px={1} as="span" bg={gray}>
                    {'/users/{id}'}
                  </Text>
                </ListItem>
              </UnorderedList>
            </Flex>
          </VStack>

          <input type={'hidden'} name="groupId" value={groupId} />
        </ModalBody>

        <ModalFooter>
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            type="submit"
            name="_action"
            value={Action.NEW_API}
            colorScheme="blue"
          >
            Create
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </FormModal>
  );
};

const SideNavContent = () => {
  const matches = useMatches();
  const params = useParams();
  const project = matches[1].data.project as Project;
  const [treeData, setTreeData] = useState<TreeData>(
    new TreeBuilder('1', null)
  );
  const fetcher = useFetcher();
  invariant(project);
  useEffect(() => {
    const complexTree = new TreeBuilder(1, null);
    const generateTreeData = (group: Group, builder: TreeBuilder) => {
      for (let g of group.groups) {
        const childTree = new TreeBuilder(g.id, g);
        generateTreeData(g, childTree);
        builder.withSubTree(childTree);
      }
      for (let api of group.apis) {
        builder.withLeaf(api.id, api);
      }
    };
    generateTreeData(project.root, complexTree);
    const buildData = complexTree.build();
    Object.keys(buildData.items).some(itemId => {
      const itemData = buildData.items[itemId].data;
      if (itemData && (itemData.id === params.groupId || (itemData.data && itemData.id === params.apiId))) {
        Object.keys(buildData.items).some(key => {
          if(`${buildData.items[itemId].id}`.startsWith(key)){
            buildData.items[key].isExpanded = true;
          }
        });
        return true;
      }
    });
    setTreeData(buildData);
  }, [params.projectId, params.groupId, params.apiId]);
  invariant(project);
  const renderItem = ({
    item,
    onExpand,
    onCollapse,
    provided,
  }: RenderItemParams) => {
    return (
      <Box
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <Box {...provided.dragHandleProps}>
          {item.data.data ? (
            <File key={item.id} api={item.data} />
          ) : (
            <Folder
              key={item.id}
              group={item.data}
              isExpanded={item.isExpanded}
              itemId={item.id}
              onExpand={onExpand}
              onCollapse={onCollapse}
              onAdd={() => {}}
              onDelete={() => {}}
            />
          )}
        </Box>
      </Box>
    );
  };

  const onExpand = (itemId: ItemId) => {
    setTreeData(mutateTree(treeData, itemId, { isExpanded: true }));
  };

  const onCollapse = (itemId: ItemId) => {
    setTreeData(mutateTree(treeData, itemId, { isExpanded: false }));
  };
  const onDragEnd = (
    source: TreeSourcePosition,
    destination?: TreeDestinationPosition
  ) => {
    if (!destination) {
      return;
    }
    const itemData =
      treeData.items[treeData.items[source.parentId].children[source.index]].data;
    const destItem = treeData.items[destination.parentId].data;
    if (destItem.data) {
      return;
    }
    itemData.data
      ? fetcher.submit(
        {
          id: itemData.id,
          groupId: destItem.id,
          _action: Action.UPDATE_API,
        },
        {
          method: 'patch',
          action: `/projects/${params.projectId}/apis`,
        }
      )
      : fetcher.submit(
        {
          id: itemData.id,
          name: itemData.name,
          description: itemData.description,
          parentId: destItem.id,
          _action: Action.UPDATE_GROUP,
        },
        {
          method: 'patch',
          action: `/projects/${params.projectId}/apis`,
        }
      );
    setTreeData(moveItemOnTree(treeData, source, destination));
  };
  resetServerContext();
  return (
    <Flex flexDir={'column'}>
      <Tree
        tree={treeData}
        renderItem={renderItem}
        onExpand={onExpand}
        onCollapse={onCollapse}
        onDragEnd={onDragEnd}
        isDragEnabled
        isNestingEnabled
      />
    </Flex>
  );
};

const Folder = ({
  itemId,
  group,
  onDelete,
  onAdd,
  onExpand,
  onCollapse,
  isExpanded,
}: {
  itemId: ItemId;
  group: Group;
  onDelete: (value: string) => void;
  isExpanded?: boolean;
  onExpand: (itemId: ItemId) => void;
  onCollapse: (itemId: ItemId) => void;
  onAdd: (value: string) => void;
}) => {
  const { projectId, groupId } = useParams<{
    projectId: string;
    groupId: string;
  }>();
  const isActive = groupId === group.id;
  const bg = useColorModeValue('blue.200', 'blue.600');
  const iconColor = useColorModeValue('blackAlpha.600', 'whiteAlpha.800');
  const hoverColor = useColorModeValue('blue.100', 'blue.800');
  const deleteModal = useDisclosure();
  return (
    <Flex border={'none'} flexDir="column">
      <HStack
        spacing={0}
        w="full"
        borderRadius={2}
        px={2}
        _hover={{ background: isActive ? undefined : hoverColor }}
        cursor="pointer"
        role="group"
        h={8}
        bg={isActive ? bg : undefined}
        onClick={(_e) =>
          isActive
            ? isExpanded
              ? onDelete(group.id)
              : onAdd(group.id)
            : undefined
        }
      >
        <Center
          mr={1}
          w="4"
          h="4"
          borderRadius={'full'}
          _groupHover={{ background: 'blackAlpha.50' }}
          onClick={() => (isExpanded ? onCollapse(itemId) : onExpand(itemId))}
        >
          <Icon
            as={isExpanded ? BsFillCaretDownFill : BsFillCaretRightFill}
            color={iconColor}
            fontSize={10}
          />
        </Center>
        <Box
          as={RemixLink}
          flexGrow={1}
          display="flex"
          alignItems={'center'}
          to={`/projects/${projectId}/apis/groups/${group.id}`}
        >
          <Icon
            as={isExpanded ? BsFolder2Open : FiFolder}
            fontWeight="100"
            color={iconColor}
            mr={2}
          />
          <Text py={1} userSelect={'none'}>
            {group.name}
          </Text>
        </Box>
        <Spacer />
        <DeleteButton onOpen={deleteModal.onOpen} />
        <DeleteApiDialog
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          name={group.name}
          id={group.id}
          isGroup={true}
        />
      </HStack>
    </Flex>
  );
};

export const useMethodTag = (method: string) => {
  let colorMode = useColorMode();
  let color = '';
  let [value, setValue] = useState(generator(method));

  useEffect(() => {
    setValue(generator(method));
  }, [method, colorMode.colorMode]);

  function generator(method: string) {
    let text: string = method;

    switch (method) {
      case RequestMethod.GET:
        color = 'green';
        break;
      case RequestMethod.POST:
        color = 'orange';
        break;
      case RequestMethod.PUT:
        color = 'blue';
        break;
      case RequestMethod.PATCH:
        color = 'teal';
        text = 'PAT';
        break;
      case RequestMethod.DELETE:
        color = 'red';
        text = 'DEL';
        break;
      case RequestMethod.HEAD:
        color = 'purple';
        break;
      case RequestMethod.OPTIONS:
        color = 'cyan';
    }

    color += colorMode.colorMode === 'light' ? '.600' : '.300';

    return { text, color };
  }

  return value;
};

const MethodTag = ({ method }: { method: RequestMethod }) => {
  let { text, color } = useMethodTag(method);

  return (
    <Text
      fontWeight={700}
      fontSize="xs"
      mt={0.25}
      color={color}
      flexBasis="40px"
      flexShrink={0}
      flexGrow={0}
    >
      {text}
    </Text>
  );
};

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <Center pt={10}>
      {caught.status}-{caught.statusText}
    </Center>
  );
}

const DeleteButton = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <Button
      display="none"
      _groupHover={{
        display: 'inline-flex',
      }}
      colorScheme={'teal'}
      variant={'ghost'}
      p={0}
      size="xs"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
    >
      <Icon as={FiTrash} />
    </Button>
  );
};

const File = ({ api }: { api: Api }) => {
  const { projectId, apiId } = useParams();
  const bg = useColorModeValue('blue.200', 'blue.600');
  const isActive = api.id === apiId;
  invariant(projectId);
  const hoverColor = useColorModeValue('blue.100', 'blue.800');
  const deleteModal = useDisclosure();
  return (
    <Flex
      as={RemixLink}
      to={`/projects/${projectId}/apis/details/${api.id}`}
      h="8"
      px={4}
      borderRadius={2}
      _hover={{ background: isActive ? undefined : hoverColor }}
      bg={isActive ? bg : undefined}
      cursor="pointer"
      role={'group'}
    >
      <HStack w="full" spacing={0} pr={2}>
        <MethodTag method={api.data.method} />
        <Text noOfLines={1}>{api.data.name}</Text>
        <Spacer />
        <DeleteButton onOpen={deleteModal.onOpen} />
        <DeleteApiDialog
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          name={api.data.name}
          id={api.id}
          isGroup={false}
        />
      </HStack>
    </Flex>
  );
};

const deleteValidator = withZod(z.object({}));
const DeleteApiDialog: React.FC<{
  isOpen: boolean;
  onClose: () => any;
  name: string;
  id: string;
  isGroup: boolean;
}> = ({ isOpen, onClose, name, id, isGroup }) => {
  const params = useParams();
  const url = useUrl();
  return (
    <Modal size={'lg'} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Please confirm</ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody py={8} textAlign={'center'}>
          <Text>
            Are you sure to delete '<strong>{name}</strong>'
            {isGroup && <span> and it's contents</span>}？
          </Text>
          <Text>
            This action <strong>cannot</strong> be undone
          </Text>
        </ModalBody>
        <Divider />
        <ModalFooter
          as={ValidatedForm}
          method="delete"
          resetAfterSubmit
          validator={deleteValidator}
          action={`/projects/${params.projectId}/apis`}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="url" value={url.href} />
          <input
            type="hidden"
            name={isGroup ? 'groupId' : 'apiId'}
            value={id}
          />
          <FormCancelButton onClick={onClose} mr={3}>
            Cancel
          </FormCancelButton>
          <FormSubmitButton
            colorScheme="red"
            name="_action"
            value={isGroup ? Action.DELETE_GROUP : Action.DELETE_API}
          >
            Delete
          </FormSubmitButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default function Apis() {
  return <Outlet />;
}
