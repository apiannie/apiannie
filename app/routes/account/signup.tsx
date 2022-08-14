import Layout from "~/components/Layout";

import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { Link } from "~/ui";
import { Form } from "@remix-run/react";

export default function SignUp() {
  return (
    <Layout>
      <Flex
        minH={"100vh"}
        justify={"center"}
        bg={useColorModeValue("gray.50", "gray.800")}
      >
        <Stack width="440px" spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
          <Stack align={"center"}>
            <Heading fontSize={"4xl"} textAlign={"center"}>
              Sign up
            </Heading>
            <Text fontSize={"lg"} color={"gray.600"}>
              to enjoy all of our cool <Link to="#">features</Link> ✌️
            </Text>
          </Stack>
          <Box
            rounded={"lg"}
            bg={useColorModeValue("white", "gray.700")}
            boxShadow={"lg"}
            p={8}
          >
            <Stack spacing={4}>
              <Form>
                <FormControl id="screenName" isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input type="text" />
                </FormControl>
                <FormControl id="email" isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input type="email" />
                </FormControl>
                <FormControl id="password" isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" />
                </FormControl>
                <FormControl id="confirm-password" isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input type="password" />
                </FormControl>
              </Form>

              <Stack spacing={10} pt={2}>
                <Button loadingText="Submitting" size="lg" colorScheme="teal">
                  Sign up
                </Button>
              </Stack>
              <Stack pt={6}>
                <Text align={"center"}>
                  Already a user?{" "}
                  <Link to="/account/signin" color={"blue.400"}>
                    Sign in
                  </Link>
                </Text>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Flex>
    </Layout>
  );
}
