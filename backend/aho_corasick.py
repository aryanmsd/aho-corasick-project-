from collections import deque

class TrieNode:
    def __init__(self):
        self.children = {}        # char -> next node
        self.failure_link = None  # fallback when match fails
        self.output = []          # keywords ending here

class AhoCorasick:
    def __init__(self):
        self.root = TrieNode()
        self.keywords = []
        self.is_built = False

    def add_keywords(self, keywords):
        for word in keywords:
            word = word.lower().strip()

            if not word or word in self.keywords:
                continue

            self.keywords.append(word)

            # walk down trie, creating nodes as needed
            node = self.root
            for char in word:
                if char not in node.children:
                    node.children[char] = TrieNode()
                node = node.children[char]

            node.output.append(word)  # mark endpoint
        
        self.is_built = False

    def build(self):
        queue = deque()

        # level 1 nodes always fall back to root
        for child in self.root.children.values():
            child.failure_link = self.root
            queue.append(child)

        while queue:
            current = queue.popleft()

            for char, child in current.children.items():
                # find longest suffix that's a valid prefix
                fallback = current.failure_link
                while fallback and char not in fallback.children:
                    if fallback == self.root:
                        fallback = None
                        break
                    fallback = fallback.failure_link

                if fallback and char in fallback.children and fallback.children[char] != child:
                    child.failure_link = fallback.children[char]
                else:
                    child.failure_link = self.root

                # inherit matches from failure link (handles overlaps like "he" in "she")
                child.output = child.output + child.failure_link.output
                queue.append(child)

        self.is_built = True

    def search(self, text):
        if not self.is_built:
            self.build()

        matches = []
        current = self.root

        for i, char in enumerate(text.lower()):
            # follow failure links until match or root
            while current != self.root and char not in current.children:
                current = current.failure_link

            if char in current.children:
                current = current.children[char]

            # collect all keywords ending at this position
            for keyword in current.output:
                matches.append({
                    "keyword": keyword,
                    "position": i - len(keyword) + 1,
                    "end": i + 1,
                    "length": len(keyword)
                })

        return matches

    def reset(self):
        self.root = TrieNode()
        self.keywords = []
        self.is_built = False