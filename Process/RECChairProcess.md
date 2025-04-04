**REC Chair Process**

**1. Login Page**

---

**2. Sidebar**

- Dashboard
- Application
- Progress Report
- Final Report
- Archiving
- Termination  
  *(Hide if there is no available paper for early termination)*

---

**3. Dashboard**

- **Summary:** Overview of the Protocol Review Application (PRA) process.
- **Analytics:** System performance and statistics.
- **Recent Submission:** Recent activities from the Proponent.  
  *(Clicking will direct to the application page)*
- **Completed Review:** List of PRA where all 3 reviewers have finished their review.  
  *(Clicking will direct to the appropriate page)*

---

**4. Application**

**4.1. Table for the Application**

Each row includes:
- **SPUP REC Code:**
- **Principal Investigator:** Name of the leader or researcher.
- **Submission Date**
- **Course/Program:** (Only the acronyms)
- **Action Button:**  
  - **View**

    **Content of the Application View:**

    - **SPUP REC Code:**
      - The admin assigns the code using an initial format.
      - Default research type is SR (Social/Behavioral Research).
      - Every year start the NNNN will be restart to 0001.
      - **Code Format:**  
        `SPUP_YYYY_NNNN_TR_FL` where:
        - **SPUP:** Institution.
        - **YYYY:** Year of submission.
        - **NNNN:** Sequential number (e.g., 0001, 0002).
        - **TR:** Type of research:
          - EX: Exempted from review
          - SR: Social/Behavioral Research
        - **FL:** Initials of first and last name.

    - **PRA Information:**
      - **Protocol Review Application Information:**
        - Principal Investigator
        - Submission Date
        - Research Title
        - Adviser
        - Course/Program (Acronyms)
        - Email Address
        - **Status:**
          - OR: On-going review (PRA is still in review stage)
          - A: Approved and on-going (Approved but final report form not submitted)
          - C: Completed (REC has issued Notification Archiving)
          - T: Terminated
        - **Funding:** (From the Protocol Review Assessment form)
          - R: Researcher-funded
          - I: Institution-funded
          - A: Agency other than institution
          - D: Pharmaceutical companies
          - O: Others
        - **Type of Research:** (Derived from the SPUP REC Code, as decided by the REC Chair)
          - EX: Experimental Research
          - SR: Social/Behavioral
        - **Progress:**  
          *(Color coded with acronyms)*
          - **SC (Submission Check):**  
            - Default label; REC Chair checks the completeness of the paper before sending to primary reviewers.
            - Date of submission.
          - **IR (Initial Review):**  
            - Submitted to primary reviewers.
            - Date assigned to primary reviewers.
          - **RS (Resubmission):**  
            - Proponent integrates corrections/suggestions.
            - Count of resubmissions and dates when each resubmission is reviewed until approved.
          - **AP (Approved):**  
            - All requirements met.
            - Date when REC Chair issued the Certificate of Approval.
          - **PR (Progress Report):**  
            - Proponent submits a progress report per REC Chair instructions.
            - Date of submission.
          - **FR (Final Report):**  
            - Proponent submits the final report.
            - Date of submission.
          - **AR (Archiving):**  
            - Date when REC Chair issued the Notification Archiving.

    - **Protocol Review Application Documents:**  
      *(Each document includes a view button to check content and a checkbox for acceptance. The REC Chair can request additional documents if needed. The decision is visible to the Proponent.)*
      - Form 07A: Protocol Review Application Form  
        *(Provides essential study details and starts the submission process.)*
      - Form 07C: Informed Consent Template  
        *(Ensures ethical standards for participant consent.)*
      - Form 07B: Adviser’s Certification Form  
        *(Confirms adviser approval of the proposal.)*
      - Research Proposal/Study Protocol  
        *(Details study design, methodology, and analysis plan.)*
      - Minutes of Proposal Defense  
        *(Records discussions and decisions from the proposal defense.)*
      - Abstract  
        *(Concise study summary: objectives, methods, and key points.)*
      - Curriculum Vitae of Researchers  
        *(Shows research team qualifications.)*
      - Questionnaires  
        *(Data collection tools.)*
      - Technical Review Approval *(if applicable)*  
        *(Required for studies needing additional technical review.)*
      - Other Documents *(if applicable)*  
        *(Additional study-related instruments.)*

    - **REC Chair Actions:**
      - Check the completeness of the PRA.
      - Request additional documents if needed.
      - Assign PRA to Primary Reviewers if all documents are ready and complete.  
        *(Common review forms: 2 Form 06A + 1 Form 06C; alternatively, 2 Form 06B or 2 Form 04A.)*
        - **Reviewer Details:**
          - Name of Primary Reviewers.
          - Forms:
            - Form 06A: Protocol Review Assessment
            - Form 06C: Informed Consent Assessment
            - Form 06B: Protocol Review Assessment (IACUC)
            - Form 04A: Checklist of Exemption from Review
      - After all Primary Reviewers finish, the REC Chair summarizes the results and decides on resubmission or approval.
      - **Input for Documents from the REC Chair to Proponent:**
        - **Resubmission:**
          - Notification of REC Decision (includes summarized Primary Reviewer recommendations).
          - Form 08A Protocol Resubmission Form (This is a default document to give).
        - **Approved:**
          - Notification of REC Decision (includes summarized Primary Reviewer recommendations).
          - Certificate of Approval.
          - Form 09B Progress Report Application Form (This is a default document to give).
          - Form 14A Final Report Form  (This is a default document to give).

---

**5. Resubmission**

**5.1. Table Resubmission**

Each row includes:

- **Principal Investigator:** Name of the leader or researcher.
- **Submission Date**
- **Course/Program:** (Only the acronyms)
- **Action Button:**  
  - **View**

    **Content of the Resubmission View:**

    - Past decision:
      - Notification of REC Decision document.
    - Proponent resubmission documents:
      - Resubmission form to be filled out by the Proponent(s).
      - Revised documents.
    - Confirmation to reassign to the reviewers.

---

**6. Approved**

**6.1. Table of Approved PRA**

Each row includes:

- **Principal Investigator:** Name of the leader or researcher.
- **Submission Date**
- **Course/Program:** (Only the acronyms)
- **Action Button:**  
  - **View**

    **Content of the Approved View:**

    - Protocol Review Application Information.
    - Certificate of Approval.
    - Notification of REC Decision document.
    - Progress Report Form *(if submitted by the Proponent)*.
    - Final Report Form *(if submitted by the Proponent)*.
    - If the Final Report form is submitted, an input to upload the document for Notification Archiving.

---

**7. Archived**

**7.1. Table of Archived PRA**

Each row includes:

- **Principal Investigator:** Name of the leader or researcher.
- **Submission Date**
- **Course/Program:** (Only the acronyms)
- **Action Button:**  
  - **View**

    **Content of the Archived View:**

    - **PRA Information:**  
      *(Lists all details of the Protocol Review Application)*
    - **PRA Documents:**  
      *(Lists original submission and any resubmission documents. Labels indicate initial and subsequent versions.)*
    - **Primary Reviewers:**  
      *(Lists primary reviewers, forms used, and indicates initial review and resubmission reviews.)*
    - **Progress Report Form:**  
      *(Viewable document.)*
    - **Final Report Form:**  
      *(Viewable document.)*
    - **Archived Document:**  
      *(Viewable document.)*

---

**8. Termination**

**8.1. Table of Terminated PRA**

Each row includes:

- **Principal Investigator:** Name of the leader or researcher.
- **Submission Date**
- **Course/Program:** (Only the acronyms)
- **Action Button:**  
  - **View**

    **Content of the Termination View:**

    - Protocol Review Application Information.
    - Documents submitted by the Proponent.
    - Review button to give to the Primary Reviewers.
