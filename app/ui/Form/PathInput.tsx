import {
  Input,
  InputGroup,
  InputLeftAddon,
  InputProps,
  Select,
} from "@chakra-ui/react";
import { RequestMethod } from "@prisma/client";
import { RequestMethods } from "~/models/type";

export interface PathInputProps extends InputProps {
  method?: RequestMethod;
  onMethodChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

const PathInput = ({
  size,
  bg,
  method,
  onMethodChange,
  ...rest
}: PathInputProps) => {
  return (
    <InputGroup size={size} bg={bg}>
      <InputLeftAddon
        bg={bg}
        children={
          <Select
            name="method"
            value={method}
            onChange={onMethodChange}
            variant="unstyled"
          >
            {RequestMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        }
      />
      <Input {...rest} />
    </InputGroup>
  );
};

export default PathInput;
