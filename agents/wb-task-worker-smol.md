---
name: wb-task-worker-smol
description: Implements one tightly scoped task with the fast model tier and shared worker contracts.
tools: [read, write, edit, grep, glob, bash]
model: ["@smol"]
thinkingLevel: xhigh
autoloadSkills: [wb-task-worker-contract, wb-tdd-discipline]
output:
  type: object
  additionalProperties: false
  required: [status, filesChanged, testsChanged, verificationCommands, observedResults, blockers]
  properties:
    status:
      type: string
      enum: [completed, blocked]
    filesChanged:
      type: array
      items:
        type: string
    testsChanged:
      type: array
      items:
        type: string
    verificationCommands:
      type: array
      items:
        type: string
    observedResults:
      type: array
      items:
        type: string
    blockers:
      type: array
      items:
        type: string
---

Apply the autoloaded worker contract and TDD discipline to the single assigned task. Yield only the declared result object.
