Absolutely. Here’s a solid Business Requirements Document (BRD) for the typing-tracking app, designed around your specific goal: measuring typing speed and accuracy with verifiable evidence, especially during blind/no-backspace typing.

Typing Performance Tracker — Business Requirements Document
Typing Performance Tracker
Business Requirements Document (BRD)

Version: 1.0
Status: Draft
Product Type: Web application
Primary Goal: Measure and prove typing speed, accuracy, and consistency with objective performance data.

1. Executive Summary

Typing Performance Tracker is a web application that allows users to complete controlled typing tests while automatically measuring their typing speed, accuracy, errors, corrections, and completion time.

The application is particularly designed for users who want to demonstrate their typing ability with verifiable evidence, rather than relying on self-reported typing speeds.

A key differentiator is Blind/No-Backspace Mode, where users can type without looking at the keyboard and optionally without using Backspace or Delete. The application records the attempt and produces a detailed performance report.

2. Problem Statement

Most people who claim a typing speed provide only a single WPM number. This does not necessarily show:

How accurate the typing was.
Whether the user corrected mistakes.
How long the test actually took.
Whether the user was looking at the keyboard.
How consistent the user's performance is.
Whether the result can be independently verified.

Users need a simple way to measure typing performance under clearly defined conditions and produce credible evidence of their results.

3. Product Vision

Create a typing-performance platform where users can say:

"This is exactly how fast and accurately I type, and here's the evidence."

The application should make typing performance measurable, repeatable, comparable, and shareable.

4. Objectives
Primary Objectives
Measure typing speed accurately.
Measure typing accuracy accurately.
Track typing duration.
Detect and record corrections.
Support no-backspace typing tests.
Support blind typing tests.
Store historical performance.
Allow users to compare attempts.
Generate evidence that can be shared with others.
Secondary Objectives
Identify common typing errors.
Track improvement over time.
Establish personal records.
Provide statistics beyond simple WPM.
Make typing practice engaging.
5. Target Users
Primary User

People who want to measure or improve their typing ability.

Examples include:

Students
Developers
Writers
Gamers
Office workers
Competitive typists
People learning touch typing
People interested in blind typing
Secondary User

People who want to demonstrate their typing ability to others.

For example:

"I can type 100 WPM without looking at the keyboard and without Backspace."

The application should provide evidence supporting such claims.

6. Core User Stories
Typing Test

As a user, I want to receive a passage to type so that I can measure my typing performance.

Speed Measurement

As a user, I want the application to calculate my WPM automatically so that I know how fast I typed.

Accuracy Measurement

As a user, I want to know how many characters and words I typed correctly.

No-Backspace Mode

As a user, I want to disable Backspace and Delete so that I can prove that I typed without correcting mistakes.

Blind Typing

As a user, I want to complete a test without looking at the keyboard so that I can measure my blind-typing ability.

Historical Tracking

As a user, I want my previous attempts saved so that I can see whether I'm improving.

Personal Records

As a user, I want the application to identify my fastest and most accurate attempts.

Evidence

As a user, I want a results page that clearly shows how my score was calculated so that I can share credible evidence of my performance.

7. Functional Requirements
7.1 Test Selection

The application shall allow users to select:

Test duration
Test difficulty
Text length
Random passage
Custom passage
Blind typing mode
No-backspace mode

Possible durations:

15 seconds
30 seconds
60 seconds
120 seconds
Custom
7.2 Typing Interface

The application shall display:

Target text
User input
Current position
Timer
Current WPM
Current accuracy
Error indicators

The interface should make the typing area the primary focus.

7.3 Timer

The timer shall:

Begin when the user enters the first character.
Continue while the test is active.
Stop when the test is completed.
Record elapsed time.
Store timing data with the attempt.

The system should record timing with sufficient precision to support reliable WPM calculations.

7.4 Keystroke Tracking

The application should record relevant keyboard events during a test.

Tracked events may include:

Character entered
Backspace
Delete
Space
Enter
Modifier keys
Timestamp of each event

This data enables detailed analysis of the attempt.

7.5 No-Backspace Mode

When enabled:

Backspace shall be disabled or treated as an invalid action.
Delete shall be disabled or treated as an invalid action.
The application shall record attempted corrections.
The result shall clearly indicate whether corrections were attempted.

Example:

Backspaces: 0
Deletes: 0
Correction attempts: 0

If the browser/platform makes physically blocking a key impractical, the system should instead record the event and exclude it from silently changing the test state.

7.6 Accuracy Calculation

The system shall calculate:

Character Accuracy

Percentage of correctly typed characters compared with the target.

Word Accuracy

Percentage of words typed correctly.

Single-character words such as:

I
a

shall count as complete words.

Error Count

The system shall identify:

Incorrect characters
Missing characters
Extra characters
Incorrect words
7.7 WPM Calculation

The application shall calculate standard Words Per Minute.

A standard calculation is:

WPM = (characters typed ÷ 5) ÷ elapsed minutes

The results screen should clearly state which WPM methodology was used.

The application may additionally provide:

Raw WPM
Corrected WPM
Net WPM
7.8 Results Screen

After completing a test, the user shall receive a results summary containing:

WPM
Accuracy
Correct words
Incorrect words
Correct characters
Incorrect characters
Test duration
Backspaces
Delete attempts
Correction attempts
Test mode

Example:

89 WPM
94.2% accuracy
0 backspaces
0 correction attempts
23.4 seconds

8. Evidence / Verification System

This is a core product requirement.

The application should generate a verifiable result rather than simply displaying a number.

A result should include:

Unique attempt ID
Timestamp
Test text or test identifier
Test duration
WPM methodology
Accuracy methodology
Keystroke/correction statistics
Test mode
Result hash or verification identifier

Example:

Blind Typing Record

91 WPM
96.1% accuracy
0 backspaces
0 deletes
42.8 seconds
Attempt ID: TYP-8F31A

The user should be able to share a results page containing the attempt information.

9. Performance History

The system shall allow users to view previous attempts.

Each attempt should contain:

Metric	Value
WPM	91
Accuracy	96.1%
Duration	42.8 sec
Correct words	51
Incorrect words	2
Backspaces	0
Mode	Blind + No Backspace

Users should be able to sort attempts by:

Fastest
Most accurate
Best net WPM
Most recent
10. Statistics Dashboard

The dashboard should display:

Speed
Average WPM
Best WPM
Lowest WPM
WPM trend
Accuracy
Average accuracy
Best accuracy
Accuracy trend
Consistency
Standard deviation of WPM
Standard deviation of accuracy
Performance over time
Corrections
Average backspaces
Total backspaces
Correction rate
11. Error Analysis

The system should identify recurring mistakes.

For example:

Most frequently confused keys

i → o
c → l
u → i

Most frequently misspelled words

correctly
without
clicking

This feature can eventually provide personalized typing exercises based on the user's actual mistakes.

12. Personal Records

The application shall automatically identify records such as:

Fastest WPM
Highest accuracy
Fastest test with ≥95% accuracy
Fastest test with zero backspaces
Best blind-typing score
Best blind + no-backspace score

Example:

🏆 Personal Record

102 WPM — 97.3% accuracy
Blind + No Backspace
60-second test

13. Sharing

Users should be able to generate a shareable results page.

The shared result should contain:

Score
Accuracy
Test conditions
Date
Verification ID

Optional social sharing:

"I just typed 102 WPM with 97.3% accuracy, blind, with zero backspaces."

The application should avoid allowing users to manually edit the displayed performance metrics.

14. Test Modes
Standard Mode

Normal typing with corrections allowed.

No-Backspace Mode

Backspace/Delete corrections are prohibited or recorded.

Blind Mode

The user is instructed not to look at the keyboard.

Blind + No-Backspace Mode

The ultimate bragging-rights mode.

The result should explicitly identify the conditions:

102 WPM — 96.8% accuracy
Blind + No Backspace

15. Non-Functional Requirements
Performance

The application should:

Respond to keystrokes immediately.
Avoid noticeable input lag.
Maintain accurate timing.
Work reliably during long typing sessions.
Reliability

Keystrokes and timing data should not be silently lost.

Security

The application should protect stored user data and prevent users from modifying completed results.

Privacy

Keystroke data should be collected only for purposes explained to the user.

Users should be able to delete their historical attempts.

Accessibility

The application should support:

Keyboard navigation
Screen readers where practical
Adjustable font sizes
High-contrast modes
16. MVP Scope

The first version should focus on the smallest useful product.

MVP Features
Typing passage
Timer
Text input
WPM calculation
Character accuracy
Word accuracy
Backspace tracking
No-backspace mode
Results screen
Attempt history
Personal best
Shareable results
Not Required for MVP
Accounts
Social network
Leaderboards
AI coaching
Advanced error prediction
Mobile application
Multiplayer competitions

These can come later.

17. Future Features

Potential future versions could include:

Competitive Leaderboards

Compare verified scores against other users.

Challenges

Examples:

80 WPM challenge
95% accuracy challenge
Zero-backspace challenge
Blind typing challenge
AI Typing Coach

Analyze mistakes and recommend exercises.

Finger Mapping

Determine which fingers/keys generate the most errors.

Typing Heatmap

Visualize frequently pressed keys and error locations.

Certificates

Generate certificates such as:

Verified Typing Performance

105 WPM
97.2% Accuracy
Blind + No Backspace

Anti-Cheat Verification

Detect suspicious behavior such as:

Pasted text
Automated keystrokes
Script-generated input
Unusual timing patterns
18. Success Metrics

The product should measure:

Number of completed tests
Tests per user
Returning users
Average WPM improvement
Average accuracy improvement
Number of shared results
Number of verified records
Percentage of users completing multiple tests

A particularly important metric is:

Percentage of users who complete at least 5 tests.

This indicates whether the application is useful as an ongoing typing tool rather than a one-time novelty.

19. Acceptance Criteria

The MVP is considered successful when:

A user can start a typing test.
The timer starts automatically with typing.
The application accurately records completion time.
WPM is calculated consistently.
Character accuracy is calculated correctly.
Word accuracy counts single-letter words such as I and a.
Backspaces are recorded.
No-backspace mode detects correction attempts.
Results cannot be manually altered after completion.
Previous attempts can be viewed.
Personal records are automatically calculated.
A user can share a result containing enough information to understand the conditions under which it was achieved.
20. Example End-to-End User Journey

Step 1: User opens the application.

Step 2: User selects:

Blind + No Backspace
60-second test

Step 3: Application displays a passage.

Step 4: User starts typing without looking at the keyboard.

Step 5: Application records every keystroke and timestamp.

Step 6: User finishes.

Step 7: Application calculates:

94 WPM
96.7% accuracy
57 correct words
2 incorrect words
0 backspaces
0 deletes

Step 8: Application saves the attempt.

Step 9: User receives a unique verification ID.

Step 10: User shares:

🏆 94 WPM — 96.7% accuracy
Blind + No Backspace
Verified Attempt #A81F29

21. Product Principle

The central principle of the product is:

Don't just tell me how good I am. Show me the evidence.

The application should prioritize transparent measurement, reproducibility, and verifiable results over flashy scores.

That is what turns a typing test into legitimate bragging rights.
