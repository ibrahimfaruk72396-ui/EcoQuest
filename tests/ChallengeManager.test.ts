import { describe, it, expect, beforeEach } from "vitest";
import { stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_CHALLENGE_NAME = 101;
const ERR_INVALID_DESCRIPTION = 102;
const ERR_INVALID_DURATION = 103;
const ERR_INVALID_REWARD = 104;
const ERR_INVALID_REQUIRED_ACTIONS = 105;
const ERR_CHALLENGE_ALREADY_EXISTS = 106;
const ERR_CHALLENGE_NOT_FOUND = 107;
const ERR_INVALID_START_TIME = 108;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INVALID_MIN_PARTICIPANTS = 110;
const ERR_INVALID_MAX_PARTICIPANTS = 111;
const ERR_ALREADY_JOINED = 121;
const ERR_NOT_JOINED = 122;
const ERR_CHALLENGE_ENDED = 123;
const ERR_CHALLENGE_NOT_STARTED = 124;
const ERR_INVALID_PROGRESS = 125;
const ERR_REWARD_ALREADY_CLAIMED = 126;

interface Challenge {
  name: string;
  description: string;
  startTime: number;
  duration: number;
  rewardAmount: number;
  requiredActions: number;
  minParticipants: number;
  maxParticipants: number;
  creator: string;
  challengeType: string;
  difficulty: number;
  gracePeriod: number;
  location: string;
  category: string;
  status: boolean;
}

interface ChallengeUpdate {
  updateName: string;
  updateDescription: string;
  updateDuration: number;
  updateTimestamp: number;
  updater: string;
}

interface Participant {
  joined: boolean;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class ChallengeManagerMock {
  state: {
    nextChallengeId: number;
    maxChallenges: number;
    creationFee: number;
    authorityContract: string | null;
    challenges: Map<number, Challenge>;
    challengeUpdates: Map<number, ChallengeUpdate>;
    challengesByName: Map<string, number>;
    challengeParticipants: Map<string, Participant>;
  } = {
    nextChallengeId: 0,
    maxChallenges: 1000,
    creationFee: 1000,
    authorityContract: null,
    challenges: new Map(),
    challengeUpdates: new Map(),
    challengesByName: new Map(),
    challengeParticipants: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  reset() {
    this.state = {
      nextChallengeId: 0,
      maxChallenges: 1000,
      creationFee: 1000,
      authorityContract: null,
      challenges: new Map(),
      challengeUpdates: new Map(),
      challengesByName: new Map(),
      challengeParticipants: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setCreationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.creationFee = newFee;
    return { ok: true, value: true };
  }

  createChallenge(
    name: string,
    description: string,
    startTime: number,
    duration: number,
    rewardAmount: number,
    requiredActions: number,
    minParticipants: number,
    maxParticipants: number,
    challengeType: string,
    difficulty: number,
    gracePeriod: number,
    location: string,
    category: string
  ): Result<number> {
    if (this.state.nextChallengeId >= this.state.maxChallenges) return { ok: false, value: ERR_MAX_CHALLENGES_EXCEEDED };
    if (!name || name.length > 100) return { ok: false, value: ERR_INVALID_CHALLENGE_NAME };
    if (!description || description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (startTime < this.blockHeight) return { ok: false, value: ERR_INVALID_START_TIME };
    if (duration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (rewardAmount <= 0) return { ok: false, value: ERR_INVALID_REWARD };
    if (requiredActions <= 0) return { ok: false, value: ERR_INVALID_REQUIRED_ACTIONS };
    if (minParticipants <= 0) return { ok: false, value: ERR_INVALID_MIN_PARTICIPANTS };
    if (maxParticipants <= 0) return { ok: false, value: ERR_INVALID_MAX_PARTICIPANTS };
    if (!["recycling", "energy-saving", "transport"].includes(challengeType)) return { ok: false, value: ERR_INVALID_CHALLENGE_TYPE };
    if (difficulty < 1 || difficulty > 10) return { ok: false, value: ERR_INVALID_DIFFICULTY };
    if (gracePeriod > 30) return { ok: false, value: ERR_INVALID_GRACE_PERIOD };
    if (!location || location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!["daily", "weekly", "monthly"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (!this.authorities.has(this.caller)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.state.challengesByName.has(name)) return { ok: false, value: ERR_CHALLENGE_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.creationFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.nextChallengeId;
    const challenge: Challenge = {
      name,
      description,
      startTime,
      duration,
      rewardAmount,
      requiredActions,
      minParticipants,
      maxParticipants,
      creator: this.caller,
      challengeType,
      difficulty,
      gracePeriod,
      location,
      category,
      status: true,
    };
    this.state.challenges.set(id, challenge);
    this.state.challengesByName.set(name, id);
    this.state.nextChallengeId++;
    return { ok: true, value: id };
  }

  getChallenge(id: number): Challenge | null {
    return this.state.challenges.get(id) || null;
  }

  updateChallenge(id: number, updateName: string, updateDescription: string, updateDuration: number): Result<boolean> {
    const challenge = this.state.challenges.get(id);
    if (!challenge) return { ok: false, value: ERR_CHALLENGE_NOT_FOUND };
    if (challenge.creator !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (!updateName || updateName.length > 100) return { ok: false, value: ERR_INVALID_CHALLENGE_NAME };
    if (!updateDescription || updateDescription.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (updateDuration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (this.state.challengesByName.has(updateName) && this.state.challengesByName.get(updateName) !== id) {
      return { ok: false, value: ERR_CHALLENGE_ALREADY_EXISTS };
    }

    const updated: Challenge = {
      ...challenge,
      name: updateName,
      description: updateDescription,
      duration: updateDuration,
      startTime: challenge.startTime,
      rewardAmount: challenge.rewardAmount,
      requiredActions: challenge.requiredActions,
      minParticipants: challenge.minParticipants,
      maxParticipants: challenge.maxParticipants,
      creator: challenge.creator,
      challengeType: challenge.challengeType,
      difficulty: challenge.difficulty,
      gracePeriod: challenge.gracePeriod,
      location: challenge.location,
      category: challenge.category,
      status: challenge.status,
    };
    this.state.challenges.set(id, updated);
    this.state.challengesByName.delete(challenge.name);
    this.state.challengesByName.set(updateName, id);
    this.state.challengeUpdates.set(id, {
      updateName,
      updateDescription,
      updateDuration,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  joinChallenge(challengeId: number): Result<boolean> {
    const challenge = this.state.challenges.get(challengeId);
    if (!challenge) return { ok: false, value: ERR_CHALLENGE_NOT_FOUND };
    if (this.blockHeight < challenge.startTime) return { ok: false, value: ERR_CHALLENGE_NOT_STARTED };
    if (this.blockHeight >= challenge.startTime + challenge.duration) return { ok: false, value: ERR_CHALLENGE_ENDED };
    const participantKey = `${challengeId}-${this.caller}`;
    if (this.state.challengeParticipants.get(participantKey)?.joined) return { ok: false, value: ERR_ALREADY_JOINED };

    this.state.challengeParticipants.set(participantKey, {
      joined: true,
      progress: 0,
      completed: false,
      rewardClaimed: false,
    });
    return { ok: true, value: true };
  }

  updateProgress(challengeId: number, actionCount: number): Result<number> {
    const challenge = this.state.challenges.get(challengeId);
    if (!challenge) return { ok: false, value: ERR_CHALLENGE_NOT_FOUND };
    const participantKey = `${challengeId}-${this.caller}`;
    const participant = this.state.challengeParticipants.get(participantKey);
    if (!participant || !participant.joined) return { ok: false, value: ERR_NOT_JOINED };
    if (this.blockHeight >= challenge.startTime + challenge.duration) return { ok: false, value: ERR_CHALLENGE_ENDED };
    const newProgress = participant.progress + actionCount;
    if (newProgress > challenge.requiredActions) return { ok: false, value: ERR_INVALID_PROGRESS };

    this.state.challengeParticipants.set(participantKey, {
      ...participant,
      progress: newProgress,
      completed: newProgress >= challenge.requiredActions,
    });
    return { ok: true, value: newProgress };
  }

  claimReward(challengeId: number): Result<number> {
    const challenge = this.state.challenges.get(challengeId);
    if (!challenge) return { ok: false, value: ERR_CHALLENGE_NOT_FOUND };
    const participantKey = `${challengeId}-${this.caller}`;
    const participant = this.state.challengeParticipants.get(participantKey);
    if (!participant || !participant.joined) return { ok: false, value: ERR_NOT_JOINED };
    if (!participant.completed) return { ok: false, value: ERR_NOT_JOINED };
    if (participant.rewardClaimed) return { ok: false, value: ERR_REWARD_ALREADY_CLAIMED };
    if (this.blockHeight < challenge.startTime + challenge.duration) return { ok: false, value: ERR_CHALLENGE_ENDED };

    this.state.challengeParticipants.set(participantKey, {
      ...participant,
      rewardClaimed: true,
    });
    return { ok: true, value: challenge.rewardAmount };
  }

  getChallengeCount(): Result<number> {
    return { ok: true, value: this.state.nextChallengeId };
  }

  checkChallengeExistence(name: string): Result<boolean> {
    return { ok: true, value: this.state.challengesByName.has(name) };
  }
}

describe("ChallengeManager", () => {
  let contract: ChallengeManagerMock;

  beforeEach(() => {
    contract = new ChallengeManagerMock();
    contract.reset();
  });

  it("creates a challenge successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createChallenge(
      "RecycleWeek",
      "Recycle 10 items",
      10,
      100,
      500,
      10,
      5,
      50,
      "recycling",
      5,
      7,
      "CityX",
      "weekly"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const challenge = contract.getChallenge(0);
    expect(challenge?.name).toBe("RecycleWeek");
    expect(challenge?.rewardAmount).toBe(500);
    expect(challenge?.requiredActions).toBe(10);
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate challenge names", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    const result = contract.createChallenge("RecycleWeek", "Recycle 20 items", 20, 200, 1000, 20, 10, 100, "recycling", 6, 14, "CityY", "monthly");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_CHALLENGE_ALREADY_EXISTS);
  });

  it("rejects non-authorized caller", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.caller = "ST3FAKE";
    contract.authorities = new Set();
    const result = contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects invalid challenge name", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.createChallenge("", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CHALLENGE_NAME);
  });

  it("joins a challenge successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 10;
    const result = contract.joinChallenge(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const participant = contract.state.challengeParticipants.get("0-ST1TEST");
    expect(participant?.joined).toBe(true);
    expect(participant?.progress).toBe(0);
  });

  it("rejects joining a challenge before start", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 5;
    const result = contract.joinChallenge(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_CHALLENGE_NOT_STARTED);
  });

  it("updates progress successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 10;
    contract.joinChallenge(0);
    const result = contract.updateProgress(0, 5);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(5);
    const participant = contract.state.challengeParticipants.get("0-ST1TEST");
    expect(participant?.progress).toBe(5);
    expect(participant?.completed).toBe(false);
  });

  it("claims reward successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 10;
    contract.joinChallenge(0);
    contract.updateProgress(0, 10);
    contract.blockHeight = 110;
    const result = contract.claimReward(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(500);
    const participant = contract.state.challengeParticipants.get("0-ST1TEST");
    expect(participant?.rewardClaimed).toBe(true);
  });

  it("rejects reward claim before challenge ends", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 10;
    contract.joinChallenge(0);
    contract.updateProgress(0, 10);
    const result = contract.claimReward(0);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_CHALLENGE_ENDED);
  });

  it("rejects invalid progress update", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    contract.blockHeight = 10;
    contract.joinChallenge(0);
    const result = contract.updateProgress(0, 15);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROGRESS);
  });

  it("updates challenge successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.createChallenge("RecycleWeek", "Recycle 10 items", 10, 100, 500, 10, 5, 50, "recycling", 5, 7, "CityX", "weekly");
    const result = contract.updateChallenge(0, "RecycleMonth", "Recycle 20 items", 200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const challenge = contract.getChallenge(0);
    expect(challenge?.name).toBe("RecycleMonth");
    expect(challenge?.description).toBe("Recycle 20 items");
    expect(challenge?.duration).toBe(200);
  });
});