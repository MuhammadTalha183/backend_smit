# 09 — Relationships: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/relationships.mjs](./examples/relationships.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/relationships.mjs` and compare the output with `example.txt`. Then add a third course (`MongoDB`) and enrol Ayesha in it. Predict the output of the many-to-many query before running it again.

## Conceptual

**2.** A student and their transcript: one-to-one. Argue BOTH sides — one paragraph for embedding it, one paragraph for referencing it — then decide which wins and why.

**3.** Why is storing `courseIds` on the student AND `studentIds` on the course a bad design? Describe a concrete sequence of two operations that leaves the two copies inconsistent.

## Practical coding

**4.** Extend the example's school database: add a `teachers` collection and an `assignments` join collection (`teacherId`, `courseId`, `semester`). Then write a `$lookup` pipeline that lists every course with its teacher's name. Handle the case where a course has no teacher yet (what does `buyerName`-style flattening return then?).

## Scenario-based

**5.** Design the relationships for Q-less: offices, counters, tokens, users. Draw the four collections, state each relationship's shape (1:1, 1:N, M:N), and for each one write the implementation (embed / reference / join collection) with one sentence of justification. Then state your delete policy for one relationship: if an office is deleted, what happens to its tokens?

## Interview-style questions

- How do you model one-to-many in MongoDB?
- How do you model many-to-many, and why a join collection?
- What does `$lookup` return, and why do you need `$arrayElemAt` or `$unwind`?
- What happens to references when you delete a document?
- What is a denormalised reference, and when is it worth it?

---
