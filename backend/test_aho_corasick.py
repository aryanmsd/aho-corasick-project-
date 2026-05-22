# Unit tests for the Aho-Corasick algorithm
# Run this file with: python test_aho_corasick.py
# All tests should show PASS if the algorithm is working correctly

from aho_corasick import AhoCorasick

passed = 0
failed = 0

def test(description, condition):
    global passed, failed
    if condition:
        print(f"  ✅ PASS  {description}")
        passed += 1
    else:
        print(f"  ❌ FAIL  {description}")
        failed += 1


print("\n=== Aho-Corasick Algorithm Tests ===\n")

# Test 1: Simple match
print("1. Basic keyword match")
ac = AhoCorasick()
ac.add_keywords(["spam"])
ac.build()
results = ac.search("this is spam")
test("finds 'spam' in sentence", any(m["keyword"] == "spam" for m in results))
test("found at position 8", results[0]["position"] == 8)

# Test 2: Multiple keywords at once
print("\n2. Multiple keywords")
ac = AhoCorasick()
ac.add_keywords(["spam", "scam", "fraud"])
ac.build()
results = ac.search("contains spam and fraud here")
found = {m["keyword"] for m in results}
test("finds spam", "spam" in found)
test("finds fraud", "fraud" in found)
test("does not find scam (not in text)", "scam" not in found)

# Test 3: Overlapping keywords (classic Aho-Corasick test)
print("\n3. Overlapping keywords")
ac = AhoCorasick()
ac.add_keywords(["he", "she", "his", "hers"])
ac.build()
results = ac.search("ushers")
found = {m["keyword"] for m in results}
test("finds 'she' inside 'ushers'", "she" in found)
test("finds 'he' inside 'ushers'", "he" in found)
test("finds 'hers' inside 'ushers'", "hers" in found)

# Test 4: Case insensitive
print("\n4. Case insensitive matching")
ac = AhoCorasick()
ac.add_keywords(["spam"])
ac.build()
results = ac.search("SPAM Spam spam")
test("finds all 3 variations of SPAM", len(results) == 3)

# Test 5: No matches
print("\n5. No matches case")
ac = AhoCorasick()
ac.add_keywords(["xyz"])
ac.build()
results = ac.search("hello world")
test("returns empty list when nothing matches", results == [])

# Test 6: Empty text
print("\n6. Edge cases")
ac = AhoCorasick()
ac.add_keywords(["test"])
ac.build()
results = ac.search("")
test("handles empty text without crashing", results == [])

# Test 7: Duplicates should be ignored
ac = AhoCorasick()
ac.add_keywords(["spam", "spam", "spam"])
test("duplicate keywords are ignored", len(ac.keywords) == 1)

# Test 8: Same keyword appearing multiple times in text
print("\n7. Multiple occurrences in text")
ac = AhoCorasick()
ac.add_keywords(["ab"])
ac.build()
results = ac.search("ababab")
test("finds 3 occurrences of 'ab'", len(results) == 3)
test("positions are correct: 0, 2, 4", [m["position"] for m in results] == [0, 2, 4])

# Test 9: Reset
print("\n8. Reset functionality")
ac = AhoCorasick()
ac.add_keywords(["spam"])
ac.reset()
test("keywords list is empty after reset", ac.keywords == [])

# Summary
print(f"\n=== Results: {passed}/{passed + failed} tests passed ===")
if failed == 0:
    print("🎉 All tests passed!\n")
else:
    print(f"⚠️  {failed} test(s) failed. Please check the output above.\n")
