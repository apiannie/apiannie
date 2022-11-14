import Chance from "chance";
import { JsonNode } from "~/models/type";

const chance = new Chance();

const mockJsonHelper = (node: JsonNode, useExample: boolean): any => {
  switch (node.type) {
    case "BOOLEAN":
      return chance.bool();
    case "INT":
      return chance.integer();
    case "FLOAT":
      return chance.floating();
    case "STRING":
      if (node.example && useExample) {
        return node.example;
      }
      return chance.string();
    case "ARRAY":
      let n = Math.floor(Math.random() * 4);
      return Array(n + 1)
        .fill(null)
        .map(() =>
          node.arrayElem
            ? mockJsonHelper(node.arrayElem, useExample)
            : undefined
        );
    default:
      let obj = {} as { [key in string]: any };
      for (let child of node.children) {
        if (child.isRequired || Math.random() < 0.8) {
          obj[child.name] = mockJsonHelper(child, useExample);
        }
      }
      return obj;
  }
};

export const mockJson = (
  node: JsonNode | undefined,
  options?: {
    useExample?: boolean;
  }
): unknown => {
  if (!node) {
    return undefined;
  }
  if (!node.isRequired && Math.random() < 0.5) {
    return undefined;
  }

  return mockJsonHelper(node, options?.useExample ?? false);
};
