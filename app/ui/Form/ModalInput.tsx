import {
  Button,
  Icon,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef } from "react";
import { FiEdit } from "react-icons/fi";

const ModalInput = ({
  modal,
  isDisabled,
  ...props
}: InputProps & {
  modal?: {
    title?: string;
  };
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  let { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <InputGroup>
      <Input isDisabled={isDisabled} {...props} ref={inputRef}></Input>
      <InputRightElement h={8}>
        <Button
          isDisabled={isDisabled}
          onClick={onOpen}
          size="xs"
          colorScheme="teal"
          variant={"ghost"}
        >
          <Icon as={FiEdit} />
        </Button>
      </InputRightElement>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modal?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              ref={textAreaRef}
              defaultValue={inputRef.current?.value}
              rows={6}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={(e) => {
                if (inputRef.current && textAreaRef.current) {
                  inputRef.current.value = textAreaRef.current.value;
                }
                onClose();
              }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </InputGroup>
  );
};

export default ModalInput;
