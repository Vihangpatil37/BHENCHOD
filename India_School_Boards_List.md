# India — School Education Boards

> Board list prepared for the Smart Career Path / Career Recommendation project.
> The uploaded source provides the 28-state structure and city coverage; this file maps those states to their principal school examination boards.

## 1. National Boards

| Board Code | Board Name | Level / Scope |
|---|---|---|
| `CBSE` | Central Board of Secondary Education | National |
| `CISCE` | Council for the Indian School Certificate Examinations (ICSE/ISC) | National |
| `NIOS` | National Institute of Open Schooling | National |

## 2. State Boards — 28 States

| # | State | Main School Board / Examination Authority |
|---:|---|---|
| 1 | Andhra Pradesh | Board of Secondary Education, Andhra Pradesh (BSEAP) / Board of Intermediate Education, Andhra Pradesh (BIEAP) |
| 2 | Arunachal Pradesh | Arunachal Pradesh Board of School Education (APBSE) |
| 3 | Assam | Board of Secondary Education, Assam (SEBA) / Assam Higher Secondary Education Council (AHSEC) |
| 4 | Bihar | Bihar School Examination Board (BSEB) |
| 5 | Chhattisgarh | Chhattisgarh Board of Secondary Education (CGBSE) |
| 6 | Goa | Goa Board of Secondary and Higher Secondary Education (GBSHSE) |
| 7 | Gujarat | Gujarat Secondary and Higher Secondary Education Board (GSEB) |
| 8 | Haryana | Board of School Education Haryana (BSEH) |
| 9 | Himachal Pradesh | Himachal Pradesh Board of School Education (HPBOSE) |
| 10 | Jharkhand | Jharkhand Academic Council (JAC) |
| 11 | Karnataka | Karnataka School Examination and Assessment Board (KSEAB) |
| 12 | Kerala | Kerala Board of Public Examinations (KBPE) / Directorate of Higher Secondary Education (DHSE) |
| 13 | Madhya Pradesh | Board of Secondary Education, Madhya Pradesh (MPBSE) |
| 14 | Maharashtra | Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE) |
| 15 | Manipur | Board of Secondary Education, Manipur (BSEM) / Council of Higher Secondary Education, Manipur (COHSEM) |
| 16 | Meghalaya | Meghalaya Board of School Education (MBOSE) |
| 17 | Mizoram | Mizoram Board of School Education (MBSE) |
| 18 | Nagaland | Nagaland Board of School Education (NBSE) |
| 19 | Odisha | Board of Secondary Education, Odisha (BSE Odisha) / Council of Higher Secondary Education, Odisha (CHSE Odisha) |
| 20 | Punjab | Punjab School Education Board (PSEB) |
| 21 | Rajasthan | Board of Secondary Education, Rajasthan (RBSE/BSER) |
| 22 | Sikkim | Board of Open Schooling and Skill Education (BOSSE) / state school examination framework |
| 23 | Tamil Nadu | Tamil Nadu Directorate of Government Examinations (TNDGE) |
| 24 | Telangana | Board of Secondary Education, Telangana (BSET) / Telangana State Board of Intermediate Education (TSBIE) |
| 25 | Tripura | Tripura Board of Secondary Education (TBSE) |
| 26 | Uttar Pradesh | Board of High School and Intermediate Education, Uttar Pradesh (UPMSP) |
| 27 | Uttarakhand | Uttarakhand Board of School Education (UBSE) |
| 28 | West Bengal | West Bengal Board of Secondary Education (WBBSE) / West Bengal Council of Higher Secondary Education (WBCHSE) |

## 3. Recommended Board Dataset Structure

For implementation, store boards separately from states so the system can support multiple boards under one state and national boards.

```text
board_id
board_code
board_name
board_type
state
classes_supported
streams_supported
grading_system
subject_mapping
official_website
is_active
```

## 4. Recommended Initial Scope

- **3 national boards:** CBSE, CISCE, NIOS
- **28 state-level entries:** one entry for each state, with separate secondary/higher-secondary authorities where applicable.
- For the career recommendation engine, prioritize boards that cover **Class 10 and Class 12**, because these are the primary academic inputs.
- Keep **board**, **state**, **class**, **stream**, and **subject** as separate fields. This will make the recommendation engine easier to extend.

## 5. Source Coverage

- The uploaded source contains **28 states** and a practical city list for those states. fileciteturn0file0
- The source explicitly notes that its city list is not an exhaustive list of every statutory or census town. fileciteturn0file0
- This board mapping is intended as a practical project dataset, not a legal/exhaustive registry of every educational examining authority.

## 6. Important Implementation Note

Some states use separate authorities for secondary and higher-secondary/intermediate education. Therefore, do not force every state into exactly one board record if your application needs precise Class 10/Class 12 subject and grading mappings.
