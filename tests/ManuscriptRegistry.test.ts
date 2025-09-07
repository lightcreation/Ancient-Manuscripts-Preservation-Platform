import { describe, it, expect, beforeEach } from "vitest";

const ERR_DUPLICATE_HASH = 100;
const ERR_INVALID_HASH = 101;
const ERR_INVALID_TITLE = 102;
const ERR_INVALID_ORIGIN = 103;
const ERR_INVALID_AGE = 104;
const ERR_INVALID_DESCRIPTION = 105;
const ERR_INVALID_CATEGORY = 106;
const ERR_INVALID_LANGUAGE = 107;
const ERR_INVALID_SCRIPT = 108;
const ERR_INVALID_CONDITION = 109;
const ERR_INVALID_PROVENANCE = 110;
const ERR_MANUSCRIPT_NOT_FOUND = 111;
const ERR_NOT_AUTHORIZED = 112;
const ERR_MAX_MANUSCRIPTS_EXCEEDED = 113;
const ERR_INVALID_UPDATE_HASH = 114;
const ERR_INVALID_ACCESS_LEVEL = 119;

interface Manuscript {
  hash: string;
  owner: string;
  title: string;
  origin: string;
  age: number;
  description: string;
  category: string;
  language: string;
  script: string;
  condition: string;
  provenance: string;
  registeredAt: number;
  accessLevel: number;
  license: string;
}

interface ManuscriptUpdate {
  updateHash: string;
  updateTitle: string;
  updateDescription: string;
  updateAge: number;
  updateTimestamp: number;
  updater: string;
}

class ManuscriptRegistryMock {
  state!: {
    nextManuscriptId: number;
    maxManuscripts: number;
    manuscripts: Map<number, Manuscript>;
    manuscriptUpdates: Map<number, ManuscriptUpdate>;
    manuscriptsByHash: Map<string, number>;
  };
  blockHeight = 0;
  caller = "ST1TEST";
  authorities = new Set<string>(["ST1TEST"]);

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextManuscriptId: 0,
      maxManuscripts: 10000,
      manuscripts: new Map(),
      manuscriptUpdates: new Map(),
      manuscriptsByHash: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
  }

  isVerifiedAuthority(principal: string): { ok: boolean; value: boolean } {
    return { ok: true, value: this.authorities.has(principal) };
  }

  registerManuscript(
    hash: string,
    title: string,
    origin: string,
    age: number,
    description: string,
    category: string,
    language: string,
    script: string,
    condition: string,
    provenance: string,
    accessLevel: number,
    license: string
  ): { ok: boolean; value: number | typeof ERR_DUPLICATE_HASH } {
    const nextId = this.state.nextManuscriptId;
    if (nextId >= this.state.maxManuscripts) return { ok: false, value: ERR_MAX_MANUSCRIPTS_EXCEEDED };
    if (hash.length !== 64 || !/^[0-9a-fA-F]+$/.test(hash)) return { ok: false, value: ERR_INVALID_HASH };
    if (title.length === 0) return { ok: false, value: ERR_INVALID_TITLE };
    if (origin.length === 0) return { ok: false, value: ERR_INVALID_ORIGIN };
    if (age <= 0 || age > 10000) return { ok: false, value: ERR_INVALID_AGE };
    if (description.length === 0) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (!["historical", "religious", "scientific", "literary"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (language.length === 0) return { ok: false, value: ERR_INVALID_LANGUAGE };
    if (script.length === 0) return { ok: false, value: ERR_INVALID_SCRIPT };
    if (!["excellent", "good", "fair", "poor"].includes(condition)) return { ok: false, value: ERR_INVALID_CONDITION };
    if (provenance.length === 0) return { ok: false, value: ERR_INVALID_PROVENANCE };
    if (accessLevel < 0 || accessLevel > 3) return { ok: false, value: ERR_INVALID_ACCESS_LEVEL };
    if (license.length === 0) return { ok: false, value: ERR_INVALID_LICENSE };

    if (!this.isVerifiedAuthority(this.caller).value) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.state.manuscriptsByHash.has(hash)) return { ok: false, value: ERR_DUPLICATE_HASH };

    const newManuscript: Manuscript = {
      hash,
      owner: this.caller,
      title,
      origin,
      age,
      description,
      category,
      language,
      script,
      condition,
      provenance,
      registeredAt: this.blockHeight,
      accessLevel,
      license,
    };
    this.state.manuscripts.set(nextId, newManuscript);
    this.state.manuscriptsByHash.set(hash, nextId);
    this.state.nextManuscriptId++;
    return { ok: true, value: nextId };
  }

  getManuscript(id: number): { ok: boolean; value: Manuscript | null } {
    const manuscript = this.state.manuscripts.get(id);
    return manuscript ? { ok: true, value: manuscript } : { ok: false, value: null };
  }

  updateManuscript(
    id: number,
    newHash: string,
    newTitle: string,
    newDescription: string,
    newAge: number
  ): { ok: boolean; value: boolean | typeof ERR_MANUSCRIPT_NOT_FOUND } {
    const manuscript = this.state.manuscripts.get(id);
    if (!manuscript) return { ok: false, value: ERR_MANUSCRIPT_NOT_FOUND };
    if (manuscript.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newHash.length !== 64 || !/^[0-9a-fA-F]+$/.test(newHash)) return { ok: false, value: ERR_INVALID_UPDATE_HASH };
    if (newTitle.length === 0) return { ok: false, value: ERR_INVALID_TITLE };
    if (newDescription.length === 0) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (newAge <= 0 || newAge > 10000) return { ok: false, value: ERR_INVALID_AGE };

    if (!this.isVerifiedAuthority(this.caller).value) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const existingId = this.state.manuscriptsByHash.get(newHash);
    if (existingId !== undefined && existingId !== id) return { ok: false, value: ERR_DUPLICATE_HASH };

    const oldHash = manuscript.hash;
    this.state.manuscriptsByHash.delete(oldHash);
    this.state.manuscriptsByHash.set(newHash, id);

    const updated: Manuscript = { ...manuscript, hash: newHash, title: newTitle, description: newDescription, age: newAge };
    this.state.manuscripts.set(id, updated);
    this.state.manuscriptUpdates.set(id, {
      updateHash: newHash,
      updateTitle: newTitle,
      updateDescription: newDescription,
      updateAge: newAge,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  transferOwnership(id: number, newOwner: string): { ok: boolean; value: boolean | typeof ERR_MANUSCRIPT_NOT_FOUND } {
    const manuscript = this.state.manuscripts.get(id);
    if (!manuscript) return { ok: false, value: ERR_MANUSCRIPT_NOT_FOUND };
    if (manuscript.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };

    const updated: Manuscript = { ...manuscript, owner: newOwner };
    this.state.manuscripts.set(id, updated);
    return { ok: true, value: true };
  }

  setAccessLevel(id: number, newLevel: number): { ok: boolean; value: boolean | typeof ERR_MANUSCRIPT_NOT_FOUND } {
    const manuscript = this.state.manuscripts.get(id);
    if (!manuscript) return { ok: false, value: ERR_MANUSCRIPT_NOT_FOUND };
    if (manuscript.owner !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newLevel < 0 || newLevel > 3) return { ok: false, value: ERR_INVALID_ACCESS_LEVEL };

    const updated: Manuscript = { ...manuscript, accessLevel: newLevel };
    this.state.manuscripts.set(id, updated);
    return { ok: true, value: true };
  }
}

describe("ManuscriptRegistry", () => {
  let contract: ManuscriptRegistryMock;

  beforeEach(() => {
    contract = new ManuscriptRegistryMock();
  });

  it("registers a valid manuscript", () => {
    const result = contract.registerManuscript(
      "a".repeat(64),
      "Ancient Scroll",
      "Egypt",
      2000,
      "Detailed description",
      "historical",
      "Latin",
      "Cursive",
      "good",
      "Museum provenance",
      1,
      "CC-BY"
    );
    expect(result.ok).toBe(true);
    expect(contract.getManuscript(0).value?.title).toBe("Ancient Scroll");
  });

  it("rejects invalid hash", () => {
    const result = contract.registerManuscript(
      "bad",
      "Title",
      "Origin",
      100,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    expect(result).toEqual({ ok: false, value: ERR_INVALID_HASH });
  });

  it("rejects invalid age", () => {
    const result = contract.registerManuscript(
      "a".repeat(64),
      "Title",
      "Origin",
      0,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    expect(result).toEqual({ ok: false, value: ERR_INVALID_AGE });
  });

  it("rejects duplicate hash", () => {
    contract.registerManuscript(
      "a".repeat(64),
      "Title",
      "Origin",
      100,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    const result = contract.registerManuscript(
      "a".repeat(64),
      "Title2",
      "Origin2",
      200,
      "Desc2",
      "religious",
      "Lang2",
      "Script2",
      "fair",
      "Prov2",
      1,
      "License2"
    );
    expect(result).toEqual({ ok: false, value: ERR_DUPLICATE_HASH });
  });

  it("updates a valid manuscript", () => {
    contract.registerManuscript(
      "a".repeat(64),
      "Old Title",
      "Origin",
      100,
      "Old Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    const result = contract.updateManuscript(0, "b".repeat(64), "New Title", "New Desc", 200);
    expect(result.ok).toBe(true);
    expect(contract.getManuscript(0).value?.title).toBe("New Title");
  });

  it("rejects update for non-existent manuscript", () => {
    const result = contract.updateManuscript(99, "b".repeat(64), "Title", "Desc", 100);
    expect(result).toEqual({ ok: false, value: ERR_MANUSCRIPT_NOT_FOUND });
  });

  it("transfers ownership successfully", () => {
    contract.registerManuscript(
      "a".repeat(64),
      "Title",
      "Origin",
      100,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    const result = contract.transferOwnership(0, "ST2NEW");
    expect(result.ok).toBe(true);
    expect(contract.getManuscript(0).value?.owner).toBe("ST2NEW");
  });

  it("rejects transfer for non-existent manuscript", () => {
    const result = contract.transferOwnership(99, "ST2NEW");
    expect(result).toEqual({ ok: false, value: ERR_MANUSCRIPT_NOT_FOUND });
  });

  it("sets access level successfully", () => {
    contract.registerManuscript(
      "a".repeat(64),
      "Title",
      "Origin",
      100,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    const result = contract.setAccessLevel(0, 2);
    expect(result.ok).toBe(true);
    expect(contract.getManuscript(0).value?.accessLevel).toBe(2);
  });

  it("rejects invalid access level", () => {
    contract.registerManuscript(
      "a".repeat(64),
      "Title",
      "Origin",
      100,
      "Desc",
      "historical",
      "Lang",
      "Script",
      "good",
      "Prov",
      0,
      "License"
    );
    const result = contract.setAccessLevel(0, 4);
    expect(result).toEqual({ ok: false, value: ERR_INVALID_ACCESS_LEVEL });
  });
});