
function organizeBookmarks() {
  chrome.bookmarks.getTree(nodes => {
    const originalTree = parseNodes(nodes);
    const tree = JSON.parse(JSON.stringify(originalTree));
    clearChildrenFromNodesChildren(tree[0]);
    removeDuplicatesFromNode(originalTree[0], tree[0]);
    createBookmarks(parseNodes(tree)[0]);
    $('#content').text('Finished Organizing Your Bookmarks!');
  });
}

function parseNodes(nodes) {
  const list = [];
  nodes.forEach(node => list.push(parseNode(node)));
  sortList(list);
  return list;
}

function parseNode({ id, title, url, children }) {
  var data = { id };
  data.title = title.replace(/[^\x00-\x7F]/g, '').trim();
  if (url) {
    data.url = url;
  }
  if (children) {
    data.children = parseNodes(children);
  }
  return data;
}

function sortList(list) {
  list.sort((a, b) => {
    if (a.children && !b.children) return -1;
    if (!a.children && b.children) return 1;
    var A = a.title.toUpperCase();
    var B = b.title.toUpperCase();
    if (A < B) return -1;
    if (A > B) return 1;
    return 0;
  });
}

function clearChildrenFromNodesChildren(node) {
  for (var i = 0; i < node.children.length; i++) {
    node.children[i].children = [];
  }
}

function removeDuplicatesFromNode(originalNode, node) {
  if (!originalNode.children) return;
  for (var i = 0; i < originalNode.children.length; i++) {
    var thisNode = node.children.find(child => originalNode.children[i].url ? child.url === originalNode.children[i].url : child.title === originalNode.children[i].title);
    if (!thisNode) {
      thisNode = { id: originalNode.children[i].id, title: originalNode.children[i].title };
      if (originalNode.children[i].url) {
        thisNode.url = originalNode.children[i].url;
      }
      if (originalNode.children[i].children) {
        thisNode.children = [];
      }
      node.children.push(thisNode);
    } else {
      thisNode = node.children.find(child => originalNode.children[i].url ? child.url === originalNode.children[i].url : child.title === originalNode.children[i].title);
      if (thisNode.title != originalNode.children[i].title) {
        thisNode.title = Array.from(new Set(`${thisNode.title} ||| ${originalNode.children[i].title}`.split(' ||| ').sort())).join(' ||| ');
      }
    }
    removeDuplicatesFromNode(originalNode.children[i], thisNode);
  }
}

function createBookmarks(rootNodes) {
  rootNodes.children.forEach(({ id, children }) => {
    chrome.bookmarks.getSubTree(id, rootNode => {
      rootNode[0].children.forEach(child => chrome.bookmarks.removeTree(child.id));
    });
    children.forEach(child => createBookmarkNodes({ id }, child));
  });
}

function createBookmarkNodes(parentNode, { title, url, children }) {
  if (!parentNode) return;
  chrome.bookmarks.create({ parentId: parentNode.id, title, url }, childNode => {
    if (!children) return;
    children.forEach(child => createBookmarkNodes(childNode, child));
  });
}

document.addEventListener('DOMContentLoaded', () => organizeBookmarks());
