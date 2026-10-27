# Writing style

Apply these rules to prose written for humans: doc comments, inline comments, draftlogs, commit messages, pull request bodies, and markdown documents.

Do not apply them to code, identifiers, log strings, error strings, quoted output, test fixtures, or text copied from another source.

These rules take their approach from ASD-STE100, the controlled-English standard used for aerospace maintenance documentation. This document is the authority in this repository. It does not implement the standard, and the publisher releases the standard only by request, so do not go looking for it to settle a question about these rules.

## Sentences

- Cap instructions and warnings at 20 words. Cap explanatory prose at 25 words.
- Cap a paragraph at six sentences, on one topic
- One idea per sentence. One instruction per step, in the imperative.
- Use the active voice. Use the passive only when the actor is genuinely unknown.
- Put the condition first, then a comma, then the command. "If the health check fails, restart the worker."
- Use no semicolons. Write two sentences.

## Lists

- End a list item with a period only when the item holds two or more sentences
- A single sentence takes no terminal period, and neither does a fragment
- Punctuate every item in one list the same way. If one item needs two sentences, the rest still follow the rule above.
- Use a vertical list when a sentence would carry more than three items

## Words

- No present perfect. Write "the run finished", not "the run has finished".
- No `be` plus a past participle. Write "you must set the flag", not "the flag must be set".
- No `-ing` verbs. An `-ing` word is fine as a noun or a modifier, as in "the polling interval".
- Describe an action with a verb, not a noun phrase. "Validate the payload", not "perform validation of the payload".
- Keep articles, subjects, verbs, and the word `that`. Write no telegraphic comments.
- Give the number, the condition, or the mechanism. Never write an abstract sentence.
- Cap a compound name at three words. Break a longer chain with `of`, `for`, `in`, or `on`.
- One word carries one meaning across the repository, and works as one part of speech
- Copy an identifier exactly as the code spells it. Never inflect it. Never use it as a verb.
- Replace an ambiguous `it`, `they`, or `this` with the noun
- American spelling. Gender-neutral throughout. No Latin abbreviations.
- Prefer `-` over `—`

## Substitutions

| Do not write | Write |
|---|---|
| ensure | make sure that |
| utilize, leverage | use |
| shall, should | must |
| may | can |
| perform, execute | do, or the specific verb |
| via | with, by, through |
| prior to | before |
| subsequent to | after |
| in order to | to |
| due to the fact that | because |
| however | but |
| therefore | thus |
| e.g. | for example |
| i.e. | that is |
| etc. | name the items, or drop it |
| required | necessary |
| acceptable | permitted |
| avoid | prevent |
| check | inspect, test, make sure that |
| main | primary |
| both | the two |
| simply, just, obviously, please | delete the word |

No phrasal verbs. Write `start` for "spin up" and "kick off", `stop` or `delete` for "tear down", `deploy` for "roll out", `wait` for "back off", `find` or `get` for "look up", `configure` or `install` for "set up".

## Doc comments

A doc comment is a contract, not a summary of the body. State what the unit does, what the caller supplies and its limits, what the unit returns, and how it fails.

Add the mechanism only when the caller must act on it:

- the unit blocks, does I/O, or takes a lock
- the cost surprises the caller
- the unit mutates an argument or returns internal state
- the unit is not concurrency-safe
- the unit caches, retries, or is not idempotent
- the call order or a precondition matters

Leave out private helper names, algorithms, data structures, and the reason for the implementation. The reason belongs in the commit message.

## Warnings

- `WARNING` for data loss, security exposure, an outage, or an irreversible action
- `CAUTION` for recoverable breakage
- `NOTE` for information with no risk

Every warning and caution names both the command or condition and the consequence. A note carries no instruction. If a note holds an imperative, promote it to a step.

## Deviations

Deviate, and say so in the pull request body, when a rule would force a false statement, when the text quotes an external source, when an external standard fixes a term, or when the reader is a machine.
