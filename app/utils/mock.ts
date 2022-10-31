import Chance from "chance";
import { JsonNode } from "~/models/type";

const chance = new Chance();

const mockJsonHelper = (node: JsonNode): any => {
  switch (node.type) {
    case "BOOLEAN":
      return chance.bool();
    case "INT":
      return chance.integer();
    case "FLOAT":
      return chance.floating();
    case "STRING":
      return chance.string();
    case "ARRAY":
      let n = Math.floor(Math.random() * 4);
      return Array(n + 1)
        .fill(null)
        .map(() =>
          node.arrayElem ? mockJsonHelper(node.arrayElem) : undefined
        );
    default:
      let obj = {} as { [key in string]: any };
      for (let child of node.children) {
        if (child.isRequired || Math.random() < 0.8) {
          obj[child.name] = mockJsonHelper(child);
        }
      }
      return obj;
  }
};

export const mockJson = (node: JsonNode): unknown => {
  if (!node.isRequired && Math.random() < 0.5) {
    return undefined;
  }

  return mockJsonHelper(node);
};
