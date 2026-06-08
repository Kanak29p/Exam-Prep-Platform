import { describe, test, expect } from "vitest";
import { escapeRegExp, buildPageList, highlightText } from "./pagination";

describe("pagination utils", () => {
  describe("escapeRegExp", () => {
    test("escapes regex control characters correctly", () => {
      const specialStr = "Hello .*+?^${}()|[]\\ World";
      const escaped = escapeRegExp(specialStr);
      expect(escaped).toBe("Hello \\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\ World");
    });

    test("leaves standard strings untouched", () => {
      expect(escapeRegExp("standardText123")).toBe("standardText123");
    });
  });

  describe("buildPageList", () => {
    test("returns all pages when totalPages <= 7", () => {
      expect(buildPageList(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(buildPageList(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    test("generates start ellipsis correctly when page is close to end", () => {
      // currentPage = 9, totalPages = 10 -> left = Math.max(2, 8) = 8, right = Math.min(9, 10) = 9
      // pages should have 1, 'ellipsis', 8, 9, 10
      expect(buildPageList(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
    });

    test("generates end ellipsis correctly when page is close to start", () => {
      // currentPage = 2, totalPages = 10
      // pages should have 1, 2, 3, 'ellipsis', 10
      expect(buildPageList(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
    });

    test("generates dual ellipses correctly when page is in the middle", () => {
      // currentPage = 5, totalPages = 10
      // pages should have 1, 'ellipsis', 4, 5, 6, 'ellipsis', 10
      expect(buildPageList(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    });
  });

  describe("highlightText", () => {
    test("returns span with full text if search query is empty", () => {
      const result = highlightText("PTE Exam Preparation", "");
      expect(result.type).toBe("span");
      expect(result.props.children).toBe("PTE Exam Preparation");
    });

    test("highlights matching text ignoring case", () => {
      const result = highlightText("Read Aloud and Repeat", "aloud");
      // highlightText returns a React Fragment (<>...</>) containing parts
      const parts = result.props.children;
      
      // We expect the parts to split by matching terms:
      // ["Read ", <mark ...>Aloud</mark>, " and Repeat"]
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("Read ");
      expect(parts[1].type).toBe("mark");
      expect(parts[1].props.children).toBe("Aloud");
      expect(parts[1].props.className).toContain("bg-yellow-200");
      expect(parts[2]).toBe(" and Repeat");
    });
  });
});
