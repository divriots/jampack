import fs from 'fs';

export class TreeNode {
  public path: string;
  public size: number;
  public children: Array<TreeNode>;

  constructor(path: string, size: number = -1) {
    this.path = path;
    this.size = size;
    this.children = [];
  }
}

export function buildTree(rootPath: string) {
  const root = new TreeNode(rootPath);

  const stack = [root];

  while (stack.length) {
    const currentNode = stack.pop();

    if (currentNode) {
      const children = fs.readdirSync(currentNode.path);

      for (let child of children) {
        const childPath = `${currentNode.path}/${child}`;
        const stat = fs.statSync(childPath);

        if (stat.isDirectory()) {
          const childNode = new TreeNode(childPath);
          currentNode.children.push(childNode);
          stack.push(childNode);
        }
        else {
          const childNode = new TreeNode(childPath, stat.size);
          currentNode.children.push(childNode);
        }

      }
    }
  }

  return root;
}
