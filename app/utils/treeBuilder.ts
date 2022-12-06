import { ItemId, TreeItem } from "@atlaskit/tree";
import { Api, Group } from "~/models/project.server";

export default class TreeBuilder {
  rootId: ItemId;

  items: Record<ItemId, TreeItem>;

  constructor(rootId: ItemId, data: Group | Api | null) {
    const rootItem = this._createItem(`${rootId}`, data);
    this.rootId = rootItem.id;
    this.items = {
      [rootItem.id]: rootItem,
    };
  }

  withLeaf(id: ItemId, data: Group | Api | null) {
    const leafItem = this._createItem(`${this.rootId}-${id}`, data);
    this._addItemToRoot(leafItem.id);
    this.items[leafItem.id] = leafItem;
    return this;
  }

  withSubTree(tree: TreeBuilder) {
    const subTree = tree.build();
    this._addItemToRoot(`${this.rootId}-${subTree.rootId}`);

    Object.keys(subTree.items).forEach((itemId) => {
      const finalId = `${this.rootId}-${itemId}`;
      this.items[finalId] = {
        ...subTree.items[itemId],
        id: finalId,
        children: subTree.items[itemId].children.map(
          (i) => `${this.rootId}-${i}`
        ),
      };
    });

    return this;
  }

  build() {
    return {
      rootId: this.rootId,
      items: this.items,
    };
  }

  _addItemToRoot(id: ItemId) {
    const rootItem = this.items[this.rootId];
    rootItem.children.push(id);
    rootItem.isExpanded = false;
    rootItem.hasChildren = true;
  }

  _createItem = (id: ItemId, data: Group | Api | null) => {
    return {
      id: `${id}`,
      children: [],
      hasChildren: false,
      isExpanded: false,
      isChildrenLoading: false,
      data: data,
    };
  };
}
