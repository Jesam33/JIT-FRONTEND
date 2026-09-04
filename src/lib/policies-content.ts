// AUTO-GENERATED from the client's verbatim policy text — do not edit by hand.
// Source: legal text supplied by Jorsas Tech. Regenerate if the source changes.

export type PolicyBlock =
  | { type: "part"; label: string; title: string }
  | { type: "section"; num: string; title: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "copyright"; text: string };

export type Policy = {
  id: string;
  title: string;
  shortTitle: string;
  lastUpdated?: string;
  effectiveDate?: string;
  blocks: PolicyBlock[];
};

const policiesRaw: Policy[] = [
  {
    "id": "certificates-and-credentials",
    "title": "JIT CAMPUS CERTIFICATE ISSUANCE, VERIFICATION AND CREDENTIAL POLICY",
    "shortTitle": "Certificates & Credentials",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, deliver Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "This Certificate Issuance, Verification and Credential Policy (“Policy”) establishes the rules governing certificates and other educational credentials created, issued, stored or verified using JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide technology that enables Online Academies to:"
      },
      {
        "type": "list",
        "items": [
          "create certificate templates;",
          "establish Course completion requirements;",
          "issue certificates to Students;",
          "assign certificate identification numbers;",
          "generate digital certificates;",
          "maintain certificate records;",
          "allow certificate verification; and",
          "withdraw or correct certificates where appropriate."
        ]
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise, certificates generated through an Online Academy on JIT Campus are issued by that Online Academy and not by Jorsas Tech or JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "The fact that a certificate is created, stored or verifiable through JIT Campus does not, by itself, mean that the certificate or Course is:"
      },
      {
        "type": "list",
        "items": [
          "accredited;",
          "government approved;",
          "professionally recognised;",
          "regulated;",
          "equivalent to a university qualification;",
          "recognised by an employer;",
          "recognised for immigration purposes; or",
          "endorsed by Jorsas Tech."
        ]
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "PURPOSE OF CERTIFICATES"
      },
      {
        "type": "section",
        "num": "2",
        "title": "Certificate Function"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may issue a certificate to recognise that a Student has satisfied requirements established by that Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Depending on the Course, a certificate may represent:"
      },
      {
        "type": "list",
        "items": [
          "Course completion;",
          "participation;",
          "attendance;",
          "achievement;",
          "successful assessment;",
          "professional development;",
          "skills training; or",
          "another educational accomplishment."
        ]
      },
      {
        "type": "paragraph",
        "text": "The meaning of a certificate should be determined by the Online Academy and accurately communicated to Students."
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "TYPES OF CREDENTIAL"
      },
      {
        "type": "section",
        "num": "3",
        "title": "Certificate of Completion"
      },
      {
        "type": "paragraph",
        "text": "A Certificate of Completion may confirm that a Student completed the requirements established for a Course."
      },
      {
        "type": "paragraph",
        "text": "Completion does not automatically mean that the Student has obtained a regulated qualification."
      },
      {
        "type": "section",
        "num": "4",
        "title": "Certificate of Achievement"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may issue a Certificate of Achievement where the Student has met specified assessment or performance requirements."
      },
      {
        "type": "paragraph",
        "text": "The Online Academy is responsible for determining those requirements."
      },
      {
        "type": "section",
        "num": "5",
        "title": "Certificate of Participation"
      },
      {
        "type": "paragraph",
        "text": "A Certificate of Participation may confirm that a Student participated in a Course, event or learning activity."
      },
      {
        "type": "paragraph",
        "text": "It should not be represented as proof that the Student passed an assessment where no such assessment occurred."
      },
      {
        "type": "section",
        "num": "6",
        "title": "Other Credentials"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may support additional credentials such as:"
      },
      {
        "type": "list",
        "items": [
          "badges;",
          "completion records;",
          "digital credentials;",
          "transcripts;",
          "statements of achievement; or",
          "other educational records."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Online Academy remains responsible for accurately describing what each credential represents."
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "WHO ISSUES THE CERTIFICATE?"
      },
      {
        "type": "section",
        "num": "7",
        "title": "Online Academy-Issued Certificates"
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise, a certificate generated for a Course is issued by the Online Academy responsible for that Course."
      },
      {
        "type": "paragraph",
        "text": "For example, if:"
      },
      {
        "type": "paragraph",
        "text": "ABC Digital Academy"
      },
      {
        "type": "paragraph",
        "text": "operates an Online Academy through JIT Campus and issues a certificate to a Student, the certificate is ordinarily an ABC Digital Academy certificate."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology used to create, store or verify it."
      },
      {
        "type": "section",
        "num": "8",
        "title": "JIT Campus Is Not Automatically the Awarding Body"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should not be described as the awarding institution simply because the certificate was generated through the Platform."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy must not state:"
      },
      {
        "type": "paragraph",
        "text": "“This qualification is awarded by JIT Campus”"
      },
      {
        "type": "paragraph",
        "text": "unless Jorsas Tech has expressly authorised JIT Campus to act as an awarding body for that particular programme."
      },
      {
        "type": "section",
        "num": "9",
        "title": "Jorsas Tech Credentials"
      },
      {
        "type": "paragraph",
        "text": "Jorsas Tech may separately operate its own Courses or programmes."
      },
      {
        "type": "paragraph",
        "text": "Where Jorsas Tech itself is the Course provider, certificates may be issued by Jorsas Tech or another expressly identified entity."
      },
      {
        "type": "paragraph",
        "text": "Such circumstances should be clearly distinguished from independent Online Academies operating through JIT Campus."
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "CERTIFICATE ELIGIBILITY"
      },
      {
        "type": "section",
        "num": "10",
        "title": "Online Academy Requirements"
      },
      {
        "type": "paragraph",
        "text": "Each Online Academy determines the requirements a Student must satisfy before receiving its certificate."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "completing required lessons;",
          "achieving a minimum assessment score;",
          "completing assignments;",
          "meeting attendance requirements;",
          "completing practical activities;",
          "paying applicable Course fees;",
          "satisfying academic integrity requirements; or",
          "meeting another legitimate Course requirement."
        ]
      },
      {
        "type": "section",
        "num": "11",
        "title": "Requirements Should Be Communicated"
      },
      {
        "type": "paragraph",
        "text": "Where a Course offers a certificate, Online Academies should clearly communicate material certificate requirements to Students."
      },
      {
        "type": "paragraph",
        "text": "Students should not ordinarily discover after completing a Course that significant undisclosed requirements prevent them from receiving the advertised certificate."
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "AUTOMATIC CERTIFICATE ISSUANCE"
      },
      {
        "type": "section",
        "num": "12",
        "title": "Automated Certificates"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may allow Online Academies to configure certificates for automatic issuance."
      },
      {
        "type": "paragraph",
        "text": "For example, an Online Academy may configure the Platform to issue a certificate when:"
      },
      {
        "type": "list",
        "items": [
          "all mandatory modules are completed;",
          "the Student achieves a specified score; and",
          "other configured requirements are satisfied."
        ]
      },
      {
        "type": "section",
        "num": "13",
        "title": "Online Academy Responsibility for Configuration"
      },
      {
        "type": "paragraph",
        "text": "The Online Academy is responsible for ensuring that its certificate rules are configured correctly."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is not responsible for an incorrect academic outcome caused by an Online Academy deliberately or incorrectly configuring its completion criteria, except to the extent that the issue results from a malfunction of JIT Campus itself."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "MANUAL CERTIFICATE ISSUANCE"
      },
      {
        "type": "section",
        "num": "14",
        "title": "Authorised Issuance"
      },
      {
        "type": "paragraph",
        "text": "Where manual certificate issuance is available, only appropriately authorised Online Academy Users should issue certificates."
      },
      {
        "type": "section",
        "num": "15",
        "title": "Improper Issuance"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy Owner, Lecturer or administrator must not knowingly issue a certificate to falsely represent that a Student completed requirements they did not complete."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "CERTIFICATE INFORMATION"
      },
      {
        "type": "section",
        "num": "16",
        "title": "Certificate Details"
      },
      {
        "type": "paragraph",
        "text": "Depending on Platform functionality, a certificate may contain:"
      },
      {
        "type": "list",
        "items": [
          "Student name;",
          "Online Academy name;",
          "Online Academy logo;",
          "Course or Programme title;",
          "completion date;",
          "issue date;",
          "certificate number;",
          "credential identifier;",
          "authorised signatory;",
          "verification information;",
          "QR code;",
          "JIT Campus verification reference; and",
          "other appropriate information."
        ]
      },
      {
        "type": "section",
        "num": "17",
        "title": "Student Names"
      },
      {
        "type": "paragraph",
        "text": "Students are responsible for ensuring that the name recorded on their Account or submitted for certification is accurate."
      },
      {
        "type": "paragraph",
        "text": "Where a certificate contains an error, correction may be requested through the relevant Online Academy."
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "CERTIFICATE VERIFICATION"
      },
      {
        "type": "section",
        "num": "18",
        "title": "Verification Functionality"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide a certificate-verification service."
      },
      {
        "type": "paragraph",
        "text": "This may allow a person to enter a certificate number, scan a QR code or use another verification method to determine whether a corresponding certificate record exists within JIT Campus."
      },
      {
        "type": "section",
        "num": "19",
        "title": "Meaning of “Verified”"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus confirms that a certificate is verified, this ordinarily means:"
      },
      {
        "type": "paragraph",
        "text": "the certificate information presented corresponds with a certificate record maintained through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Verification does not, by itself, mean that:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus accredited the Course;",
          "Jorsas Tech approved the curriculum;",
          "the Online Academy is government accredited;",
          "the qualification is regulated;",
          "the credential is equivalent to a degree;",
          "the Student is professionally licensed; or",
          "JIT Campus guarantees the Student’s competence."
        ]
      },
      {
        "type": "paragraph",
        "text": "This distinction is fundamental."
      },
      {
        "type": "section",
        "num": "20",
        "title": "Recommended Verification Wording"
      },
      {
        "type": "paragraph",
        "text": "Where technically appropriate, the verification page should use wording such as:"
      },
      {
        "type": "paragraph",
        "text": "Certificate Record Verified"
      },
      {
        "type": "paragraph",
        "text": "This confirms that the certificate corresponds with a credential issued by the named Online Academy through JIT Campus. Verification does not constitute accreditation, professional recognition or endorsement by JIT Campus or Jorsas Tech."
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "CERTIFICATE IDENTIFIERS"
      },
      {
        "type": "section",
        "num": "21",
        "title": "Unique Certificate Numbers"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may generate a unique identifier for certificates."
      },
      {
        "type": "paragraph",
        "text": "The identifier may be used to:"
      },
      {
        "type": "list",
        "items": [
          "locate certificate records;",
          "verify authenticity;",
          "reduce certificate fraud;",
          "identify duplicates; and",
          "support administrative enquiries."
        ]
      },
      {
        "type": "section",
        "num": "22",
        "title": "QR Codes"
      },
      {
        "type": "paragraph",
        "text": "Certificates may contain QR codes directing Users to a JIT Campus verification page."
      },
      {
        "type": "paragraph",
        "text": "The presence of a QR code indicates that the certificate may be digitally checked."
      },
      {
        "type": "paragraph",
        "text": "It does not automatically indicate accreditation."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "ACCREDITATION"
      },
      {
        "type": "section",
        "num": "23",
        "title": "Accredited Qualifications"
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy states that a Course or certificate is accredited, recognised or regulated, the Online Academy is responsible for ensuring that the claim is accurate."
      },
      {
        "type": "section",
        "num": "24",
        "title": "Accreditation Information"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, an Online Academy making an accreditation claim should identify:"
      },
      {
        "type": "list",
        "items": [
          "the accrediting organisation;",
          "relevant accreditation or approval;",
          "qualification status;",
          "applicable registration or reference number where relevant; and",
          "any material limitations."
        ]
      },
      {
        "type": "section",
        "num": "25",
        "title": "JIT Campus May Request Evidence"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not need to verify every Online Academy before it can create Courses."
      },
      {
        "type": "paragraph",
        "text": "However, where an Online Academy makes a significant accreditation or regulatory claim, JIT Campus may request supporting evidence where reasonably necessary, including following:"
      },
      {
        "type": "list",
        "items": [
          "a complaint;",
          "suspected fraud;",
          "regulatory enquiry;",
          "repeated Student concerns; or",
          "other credible grounds for review."
        ]
      },
      {
        "type": "section",
        "num": "26",
        "title": "False Accreditation"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy must not knowingly claim that its Course is:"
      },
      {
        "type": "list",
        "items": [
          "accredited;",
          "government recognised;",
          "professionally recognised;",
          "university validated;",
          "regulated; or",
          "officially licensed"
        ]
      },
      {
        "type": "paragraph",
        "text": "where that claim is false."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may remove or restrict misleading claims."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "REGULATED QUALIFICATIONS"
      },
      {
        "type": "section",
        "num": "27",
        "title": "Regulated Education"
      },
      {
        "type": "paragraph",
        "text": "Some qualifications may be subject to legal or regulatory requirements."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy providing such education is responsible for ensuring that it has the authority required to offer or award the relevant qualification."
      },
      {
        "type": "section",
        "num": "28",
        "title": "Platform Access Is Not Regulatory Approval"
      },
      {
        "type": "paragraph",
        "text": "Creating an Online Academy or Course through JIT Campus does not give the Online Academy regulatory authority."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus technology must not be presented as a substitute for regulatory approval."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "PROFESSIONAL QUALIFICATIONS"
      },
      {
        "type": "section",
        "num": "29",
        "title": "Professional Status"
      },
      {
        "type": "paragraph",
        "text": "A certificate hosted through JIT Campus does not automatically make a Student a regulated professional."
      },
      {
        "type": "paragraph",
        "text": "For example, completing a Course hosted on JIT Campus does not automatically make someone a:"
      },
      {
        "type": "list",
        "items": [
          "doctor;",
          "nurse;",
          "lawyer;",
          "solicitor;",
          "accountant;",
          "engineer;",
          "teacher;",
          "financial adviser; or",
          "other regulated professional."
        ]
      },
      {
        "type": "paragraph",
        "text": "Any professional recognition must arise from the appropriate professional or regulatory framework."
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "EMPLOYMENT CLAIMS"
      },
      {
        "type": "section",
        "num": "30",
        "title": "Employment"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not guarantee that a certificate will result in employment unless there is a legitimate basis for such a guarantee."
      },
      {
        "type": "paragraph",
        "text": "Statements such as:"
      },
      {
        "type": "paragraph",
        "text": "“This certificate guarantees you a job.”"
      },
      {
        "type": "paragraph",
        "text": "must not be made where they are false or misleading."
      },
      {
        "type": "section",
        "num": "31",
        "title": "Employer Recognition"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not guarantee that every employer will recognise every certificate issued by every Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Students should consider the status and relevance of a Course before enrolling."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "IMMIGRATION AND VISA CLAIMS"
      },
      {
        "type": "section",
        "num": "32",
        "title": "Immigration Claims"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not falsely represent certificates as providing:"
      },
      {
        "type": "list",
        "items": [
          "immigration status;",
          "visa eligibility;",
          "permanent residence;",
          "citizenship;",
          "sponsorship rights; or",
          "other immigration benefits."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where a Course genuinely has recognised immigration relevance, claims must still be accurate."
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "CERTIFICATE DESIGN"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Online Academy Branding"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may customise certificates using available functionality."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy logo;",
          "Online Academy colours;",
          "authorised signatures;",
          "Online Academy name; and",
          "Course information."
        ]
      },
      {
        "type": "section",
        "num": "34",
        "title": "JIT Campus Branding"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may include limited Platform branding or verification information on certificates."
      },
      {
        "type": "paragraph",
        "text": "Such branding should not be interpreted as JIT Campus accreditation."
      },
      {
        "type": "section",
        "num": "35",
        "title": "Misleading Designs"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not design certificates to deliberately imitate:"
      },
      {
        "type": "list",
        "items": [
          "government certificates;",
          "university degrees;",
          "professional licences;",
          "regulatory certificates; or",
          "another institution’s credentials"
        ]
      },
      {
        "type": "paragraph",
        "text": "where the Online Academy has no authority to issue such credentials."
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "CERTIFICATE SIGNATORIES"
      },
      {
        "type": "section",
        "num": "36",
        "title": "Authorised Signatures"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may identify persons authorised to sign or approve certificates."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy Owner;",
          "Online Academy Director;",
          "Lecturer;",
          "Programme Lead; or",
          "another authorised person."
        ]
      },
      {
        "type": "section",
        "num": "37",
        "title": "False Signatures"
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "forge signatures;",
          "use another person’s signature without authority;",
          "falsely claim approval from a professional body; or",
          "impersonate an authorised signatory."
        ]
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "CERTIFICATE CORRECTIONS"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Administrative Errors"
      },
      {
        "type": "paragraph",
        "text": "Certificates may be corrected where there is an administrative error such as:"
      },
      {
        "type": "list",
        "items": [
          "misspelled Student name;",
          "incorrect date;",
          "incorrect Course title;",
          "incorrect certificate number; or",
          "another genuine record error."
        ]
      },
      {
        "type": "section",
        "num": "39",
        "title": "Correction Records"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, JIT Campus may retain records showing that a certificate was corrected or reissued."
      },
      {
        "type": "paragraph",
        "text": "This can help preserve the integrity of credential records."
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "REVOKING CERTIFICATES"
      },
      {
        "type": "section",
        "num": "40",
        "title": "Online Academy Revocation"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may revoke or withdraw a certificate where there are legitimate grounds."
      },
      {
        "type": "paragraph",
        "text": "Possible grounds may include:"
      },
      {
        "type": "list",
        "items": [
          "certificate issued in error;",
          "serious academic fraud;",
          "impersonation;",
          "fraudulent assessment;",
          "falsification of Course completion;",
          "administrative mistake; or",
          "another legitimate reason under Online Academy rules."
        ]
      },
      {
        "type": "section",
        "num": "41",
        "title": "Fair Process"
      },
      {
        "type": "paragraph",
        "text": "Where revocation is based on alleged Student misconduct, the Student should ordinarily have a reasonable opportunity to respond before a final decision is made."
      },
      {
        "type": "paragraph",
        "text": "This may not be necessary where the certificate was clearly generated because of an obvious technical or administrative error."
      },
      {
        "type": "section",
        "num": "42",
        "title": "Revocation Status"
      },
      {
        "type": "paragraph",
        "text": "Where verification functionality exists, a revoked certificate may display an appropriate status such as:"
      },
      {
        "type": "paragraph",
        "text": "Revoked"
      },
      {
        "type": "paragraph",
        "text": "or"
      },
      {
        "type": "paragraph",
        "text": "No Longer Valid"
      },
      {
        "type": "paragraph",
        "text": "rather than simply disappearing from the system."
      },
      {
        "type": "paragraph",
        "text": "This helps prevent fraudulent use of previously issued certificates."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "JIT CAMPUS REMOVAL OF CERTIFICATES"
      },
      {
        "type": "section",
        "num": "43",
        "title": "Platform Intervention"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may restrict certificate functionality where there is credible evidence of:"
      },
      {
        "type": "list",
        "items": [
          "systematic certificate fraud;",
          "fake Online Academies;",
          "forged credentials;",
          "false accreditation;",
          "Platform manipulation;",
          "serious academic fraud; or",
          "unlawful activity."
        ]
      },
      {
        "type": "section",
        "num": "44",
        "title": "JIT Campus Does Not Normally Determine Academic Achievement"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will not ordinarily decide whether a Student academically deserved an Online Academy’s certificate."
      },
      {
        "type": "paragraph",
        "text": "That remains an Online Academy academic decision."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may intervene where the integrity or security of the Platform itself is affected."
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "CERTIFICATE FRAUD"
      },
      {
        "type": "section",
        "num": "45",
        "title": "Prohibited Conduct"
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "create fake certificates;",
          "alter certificate verification information;",
          "manipulate QR codes;",
          "forge certificate numbers;",
          "issue certificates for fake Students;",
          "create false Course completion records;",
          "sell fraudulent certificates;",
          "modify certificate records without authority; or",
          "circumvent JIT Campus verification controls."
        ]
      },
      {
        "type": "section",
        "num": "46",
        "title": "Serious Misconduct"
      },
      {
        "type": "paragraph",
        "text": "Systematic certificate fraud may result in:"
      },
      {
        "type": "list",
        "items": [
          "Account suspension;",
          "Online Academy suspension;",
          "removal of certificate privileges;",
          "termination of Platform access; or",
          "referral to competent authorities where appropriate."
        ]
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "STUDENT SHARING OF CERTIFICATES"
      },
      {
        "type": "section",
        "num": "47",
        "title": "Sharing"
      },
      {
        "type": "paragraph",
        "text": "Students may generally share certificates legitimately issued to them."
      },
      {
        "type": "paragraph",
        "text": "This may include sharing with:"
      },
      {
        "type": "list",
        "items": [
          "employers;",
          "educational institutions;",
          "clients;",
          "professional organisations; or",
          "through professional profiles and social media."
        ]
      },
      {
        "type": "section",
        "num": "48",
        "title": "No Alteration"
      },
      {
        "type": "paragraph",
        "text": "Students must not alter a certificate in a way that materially misrepresents:"
      },
      {
        "type": "list",
        "items": [
          "their name;",
          "Course;",
          "grade;",
          "Online Academy;",
          "completion status;",
          "date;",
          "accreditation; or",
          "other credential information."
        ]
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "PUBLIC VERIFICATION INFORMATION"
      },
      {
        "type": "section",
        "num": "49",
        "title": "Limited Verification Data"
      },
      {
        "type": "paragraph",
        "text": "Where certificate verification is publicly accessible, JIT Campus should limit displayed information to what is reasonably necessary to verify the credential."
      },
      {
        "type": "paragraph",
        "text": "Depending on the design, this may include:"
      },
      {
        "type": "list",
        "items": [
          "Student name;",
          "Course;",
          "Online Academy;",
          "issue date;",
          "certificate identifier; and",
          "certificate status."
        ]
      },
      {
        "type": "section",
        "num": "50",
        "title": "Privacy"
      },
      {
        "type": "paragraph",
        "text": "Certificate verification should be designed with appropriate privacy safeguards."
      },
      {
        "type": "paragraph",
        "text": "Sensitive Student information should not be publicly displayed merely because a certificate is verifiable."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "CERTIFICATES AFTER ONLINE ACADEMY CLOSURE"
      },
      {
        "type": "section",
        "num": "51",
        "title": "Existing Certificates"
      },
      {
        "type": "paragraph",
        "text": "Where technically and legally practicable, JIT Campus may retain verification records for legitimately issued certificates after an Online Academy closes."
      },
      {
        "type": "paragraph",
        "text": "This may allow Students to continue verifying previously earned credentials."
      },
      {
        "type": "section",
        "num": "52",
        "title": "No Guarantee of Permanent Hosting"
      },
      {
        "type": "paragraph",
        "text": "Unless expressly guaranteed under a specific Service arrangement, JIT Campus does not promise that every certificate will remain hosted or verifiable indefinitely."
      },
      {
        "type": "paragraph",
        "text": "Online Academies and Students should retain appropriate copies of important credentials."
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "ONLINE ACADEMY SUSPENSION"
      },
      {
        "type": "section",
        "num": "53",
        "title": "Certificates From Suspended Online Academies"
      },
      {
        "type": "paragraph",
        "text": "Suspension of an Online Academy does not automatically mean that every certificate previously issued by that Online Academy was fraudulent."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may determine how verification records should be displayed based on the circumstances."
      },
      {
        "type": "section",
        "num": "54",
        "title": "Fraudulent Online Academy"
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy is determined to have been created primarily to issue fraudulent credentials, JIT Campus may invalidate or restrict relevant certificate records."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "CERTIFICATE DATA"
      },
      {
        "type": "section",
        "num": "55",
        "title": "Records"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may maintain records relating to certificate issuance, including:"
      },
      {
        "type": "list",
        "items": [
          "Student;",
          "Online Academy;",
          "Course;",
          "issue date;",
          "certificate identifier;",
          "certificate status;",
          "reissues;",
          "revocations; and",
          "relevant audit information."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such information will be handled in accordance with the JIT Campus Privacy Policy."
      },
      {
        "type": "part",
        "label": "PART XXVI",
        "title": "TECHNICAL ERRORS"
      },
      {
        "type": "section",
        "num": "56",
        "title": "Platform Errors"
      },
      {
        "type": "paragraph",
        "text": "Where a certificate is incorrectly generated because of a verified JIT Campus technical error, JIT Campus may work with the Online Academy to:"
      },
      {
        "type": "list",
        "items": [
          "correct the record;",
          "cancel the incorrect certificate;",
          "reissue the certificate; or",
          "take another appropriate technical action."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Online Academy remains responsible for determining whether the Student academically qualifies for the certificate."
      },
      {
        "type": "part",
        "label": "PART XXVII",
        "title": "DISPUTES"
      },
      {
        "type": "section",
        "num": "57",
        "title": "Certificate Disputes"
      },
      {
        "type": "paragraph",
        "text": "A Student disputing:"
      },
      {
        "type": "list",
        "items": [
          "eligibility;",
          "grade;",
          "Course completion;",
          "academic misconduct;",
          "certificate withdrawal; or",
          "another academic matter"
        ]
      },
      {
        "type": "paragraph",
        "text": "should ordinarily raise the issue with the Online Academy."
      },
      {
        "type": "section",
        "num": "58",
        "title": "JIT Campus Disputes"
      },
      {
        "type": "paragraph",
        "text": "A complaint may be raised directly with JIT Campus where the issue concerns:"
      },
      {
        "type": "list",
        "items": [
          "verification malfunction;",
          "certificate security;",
          "unauthorised alteration;",
          "Account compromise;",
          "Platform-generated errors;",
          "systematic credential fraud; or",
          "misuse of JIT Campus branding."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVIII",
        "title": "ONLINE ACADEMY RESPONSIBILITY"
      },
      {
        "type": "section",
        "num": "59",
        "title": "Responsibility for Credentials"
      },
      {
        "type": "paragraph",
        "text": "Online Academies remain responsible for:"
      },
      {
        "type": "list",
        "items": [
          "deciding who qualifies for certificates;",
          "establishing completion requirements;",
          "ensuring certificate information is accurate;",
          "making truthful accreditation claims;",
          "appointing authorised signatories;",
          "correcting academic errors; and",
          "determining legitimate revocations."
        ]
      },
      {
        "type": "section",
        "num": "60",
        "title": "JIT Campus Responsibility"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is responsible for the technology it provides for certificate generation, storage and verification, subject to its Terms and applicable law."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not automatically assume responsibility for the academic judgment of independent Online Academies."
      },
      {
        "type": "part",
        "label": "PART XXIX",
        "title": "POLICY UPDATES"
      },
      {
        "type": "section",
        "num": "61",
        "title": "Changes to This Policy"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "new certificate functionality;",
          "digital credential technology;",
          "QR-code verification;",
          "blockchain or other verification technologies;",
          "changes to education regulation;",
          "emerging credential fraud risks; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "paragraph",
        "text": "The latest version will be published through JIT Campus."
      },
      {
        "type": "section",
        "num": "62",
        "title": "Relationship With Other Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Online Academy Owner and Online Academy Management Policy;",
          "Academic Regulations and Assessment Policy;",
          "Academic Integrity Policy;",
          "Intellectual Property and Copyright Policy;",
          "Acceptable Use and Prohibited Activities Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "part",
        "label": "PART XXX",
        "title": "CONTACT"
      },
      {
        "type": "section",
        "num": "63",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "Questions concerning eligibility for a particular certificate should ordinarily be directed to the Online Academy that issued it."
      },
      {
        "type": "paragraph",
        "text": "Questions concerning JIT Campus certificate verification or suspected certificate fraud may be directed to JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Certificate Verification: [Insert certificate/verification email]"
      },
      {
        "type": "paragraph",
        "text": "Fraud Reports: [Insert fraud/reporting email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "intellectual-property",
    "title": "JIT CAMPUS INTELLECTUAL PROPERTY AND COPYRIGHT POLICY",
    "shortTitle": "Intellectual Property",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, deliver Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "This Intellectual Property and Copyright Policy (“Policy”) explains the rules governing ownership, use, upload, sharing, licensing and protection of intellectual property made available through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "This Policy applies to:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy Owners;",
          "Online Academies;",
          "Lecturers;",
          "Admission Marketers;",
          "Students;",
          "administrators;",
          "content creators;",
          "other Users; and",
          "content made available through JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus recognises that educational content may contain valuable intellectual property belonging to Online Academies, Lecturers, Students, Jorsas Tech or third parties."
      },
      {
        "type": "paragraph",
        "text": "Uploading content to JIT Campus does not automatically transfer ownership of that content to Jorsas Tech."
      },
      {
        "type": "paragraph",
        "text": "However, certain permissions are necessary so that JIT Campus can host, display, process, deliver and technically operate content through the Platform."
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "WHAT IS INTELLECTUAL PROPERTY?"
      },
      {
        "type": "section",
        "num": "2",
        "title": "Intellectual Property"
      },
      {
        "type": "paragraph",
        "text": "For the purposes of this Policy, intellectual property may include rights relating to:"
      },
      {
        "type": "list",
        "items": [
          "copyright;",
          "trademarks;",
          "logos;",
          "trade names;",
          "Course materials;",
          "videos;",
          "audio recordings;",
          "photographs;",
          "illustrations;",
          "graphics;",
          "presentations;",
          "books;",
          "notes;",
          "assessments;",
          "software;",
          "databases;",
          "designs;",
          "research;",
          "written works;",
          "teaching methodologies;",
          "certificates;",
          "branding;",
          "and other protected creative or commercial materials."
        ]
      },
      {
        "type": "section",
        "num": "3",
        "title": "Copyright"
      },
      {
        "type": "paragraph",
        "text": "Copyright may protect original materials such as:"
      },
      {
        "type": "list",
        "items": [
          "written Course content;",
          "videos;",
          "recorded lectures;",
          "photographs;",
          "presentations;",
          "diagrams;",
          "assignments;",
          "examination materials;",
          "audio recordings;",
          "graphics;",
          "software; and",
          "other original works."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users are responsible for ensuring that they have the right to use content they upload to JIT Campus."
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "JORSAS TECH AND JIT CAMPUS INTELLECTUAL PROPERTY"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Jorsas Tech Ownership"
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise, Jorsas Tech owns or is authorised to use intellectual property relating to the JIT Campus Platform itself."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus software;",
          "source code;",
          "Platform architecture;",
          "user interface;",
          "databases;",
          "Platform design;",
          "JIT Campus logos;",
          "JIT Campus branding;",
          "JIT Campus documentation;",
          "Platform-generated templates;",
          "technical systems;",
          "proprietary features; and",
          "other Jorsas Tech materials."
        ]
      },
      {
        "type": "section",
        "num": "5",
        "title": "No Transfer of Platform Ownership"
      },
      {
        "type": "paragraph",
        "text": "A User’s access to JIT Campus does not give the User ownership of Jorsas Tech’s intellectual property."
      },
      {
        "type": "paragraph",
        "text": "Users receive only the right to use JIT Campus in accordance with:"
      },
      {
        "type": "list",
        "items": [
          "the JIT Campus Terms and Conditions;",
          "this Policy;",
          "the User’s subscription or Service arrangement; and",
          "applicable law."
        ]
      },
      {
        "type": "section",
        "num": "6",
        "title": "JIT Campus Name and Branding"
      },
      {
        "type": "paragraph",
        "text": "Users must not use the JIT Campus or Jorsas Tech name, logo or branding in a manner that falsely suggests:"
      },
      {
        "type": "list",
        "items": [
          "ownership;",
          "employment;",
          "official endorsement;",
          "accreditation;",
          "partnership;",
          "certification;",
          "sponsorship; or",
          "regulatory approval."
        ]
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may accurately state that it uses or is hosted on JIT Campus where this is true."
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "ONLINE ACADEMY INTELLECTUAL PROPERTY"
      },
      {
        "type": "section",
        "num": "7",
        "title": "Online Academy Content"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may own or control intellectual property relating to content it creates or legitimately acquires."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "Course materials;",
          "Online Academy branding;",
          "videos;",
          "presentations;",
          "assessments;",
          "written content;",
          "curriculum;",
          "graphics;",
          "training materials;",
          "Online Academy logos;",
          "and other educational resources."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not automatically take ownership of such material merely because it is uploaded to the Platform."
      },
      {
        "type": "section",
        "num": "8",
        "title": "Online Academy Responsibility"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for ensuring that their Online Academy has appropriate rights to materials uploaded through the Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not knowingly upload:"
      },
      {
        "type": "list",
        "items": [
          "pirated Courses;",
          "unlawfully copied textbooks;",
          "stolen videos;",
          "copyrighted training materials without permission;",
          "another Online Academy’s content presented as their own; or",
          "other material they do not have the right to use."
        ]
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "LECTURER CONTENT"
      },
      {
        "type": "section",
        "num": "9",
        "title": "Lecturer-Created Materials"
      },
      {
        "type": "paragraph",
        "text": "Lecturers may create educational materials for use in Courses."
      },
      {
        "type": "paragraph",
        "text": "Ownership of those materials may depend on:"
      },
      {
        "type": "list",
        "items": [
          "the Lecturer’s agreement with the Online Academy;",
          "employment arrangements;",
          "commissioning arrangements;",
          "copyright law;",
          "licensing arrangements; or",
          "another agreement between the relevant parties."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not automatically determine ownership disputes between a Lecturer and an Online Academy."
      },
      {
        "type": "section",
        "num": "10",
        "title": "Lecturer Uploads"
      },
      {
        "type": "paragraph",
        "text": "A Lecturer who uploads material confirms that they have:"
      },
      {
        "type": "list",
        "items": [
          "created the material;",
          "obtained permission to use it;",
          "received authority from the relevant Online Academy; or",
          "otherwise have a legitimate right to make it available."
        ]
      },
      {
        "type": "section",
        "num": "11",
        "title": "No Automatic Transfer to JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Lecturer content does not automatically become the property of Jorsas Tech merely because it is uploaded."
      },
      {
        "type": "paragraph",
        "text": "However, the necessary licence described later in this Policy may apply so that JIT Campus can operate the Service."
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "STUDENT INTELLECTUAL PROPERTY"
      },
      {
        "type": "section",
        "num": "12",
        "title": "Student Work"
      },
      {
        "type": "paragraph",
        "text": "Students may create original work through JIT Campus, including:"
      },
      {
        "type": "list",
        "items": [
          "assignments;",
          "essays;",
          "projects;",
          "presentations;",
          "designs;",
          "photographs;",
          "research;",
          "videos;",
          "code; and",
          "other academic work."
        ]
      },
      {
        "type": "paragraph",
        "text": "Unless a specific lawful agreement provides otherwise, the Student generally retains ownership of intellectual property they hold in their original work."
      },
      {
        "type": "section",
        "num": "13",
        "title": "Student Licence to JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "By submitting Student work through JIT Campus, the Student grants Jorsas Tech the limited permissions reasonably necessary to:"
      },
      {
        "type": "list",
        "items": [
          "store the work;",
          "display it to authorised Users;",
          "deliver it to the relevant Lecturer or Online Academy;",
          "process it for assessment;",
          "maintain academic records;",
          "support academic integrity processes;",
          "provide backups;",
          "investigate complaints;",
          "operate Platform functionality; and",
          "comply with legal obligations."
        ]
      },
      {
        "type": "paragraph",
        "text": "This does not give JIT Campus an unrestricted right to commercially sell a Student’s work as its own."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "LICENCE GRANTED TO JIT CAMPUS"
      },
      {
        "type": "section",
        "num": "14",
        "title": "Platform Licence"
      },
      {
        "type": "paragraph",
        "text": "When a User uploads content to JIT Campus, the User grants Jorsas Tech a non-exclusive licence to use that content to the extent reasonably necessary to operate JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Depending on the Service, this may include the right to:"
      },
      {
        "type": "list",
        "items": [
          "host;",
          "store;",
          "reproduce technically;",
          "display;",
          "transmit;",
          "process;",
          "back up;",
          "format;",
          "stream;",
          "make available to authorised Users; and",
          "otherwise use the content as necessary to provide the Platform."
        ]
      },
      {
        "type": "section",
        "num": "15",
        "title": "Non-Exclusive Licence"
      },
      {
        "type": "paragraph",
        "text": "The licence is non-exclusive."
      },
      {
        "type": "paragraph",
        "text": "This means that, unless another agreement says otherwise, the content owner remains free to use their material elsewhere."
      },
      {
        "type": "section",
        "num": "16",
        "title": "Purpose Limitation"
      },
      {
        "type": "paragraph",
        "text": "The licence does not automatically give JIT Campus the right to:"
      },
      {
        "type": "list",
        "items": [
          "claim ownership of User content;",
          "sell a Lecturer’s entire Course as JIT Campus content;",
          "publish private Student assignments publicly;",
          "commercially license an Online Academy’s proprietary Course to unrelated third parties; or",
          "use confidential material for unrelated purposes"
        ]
      },
      {
        "type": "paragraph",
        "text": "unless the relevant owner has provided separate permission or another lawful basis applies."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "CONTENT MADE AVAILABLE TO STUDENTS"
      },
      {
        "type": "section",
        "num": "17",
        "title": "Student Access Licence"
      },
      {
        "type": "paragraph",
        "text": "When a Student purchases or enrols in a Course, the Student generally receives a limited right to access Course materials for personal educational use."
      },
      {
        "type": "paragraph",
        "text": "Unless expressly permitted, this does not give the Student the right to:"
      },
      {
        "type": "list",
        "items": [
          "resell the Course;",
          "republish the Course;",
          "distribute Course videos;",
          "reproduce substantial parts of the Course commercially;",
          "upload materials to piracy sites;",
          "share paid Course login access;",
          "reproduce examinations for sale; or",
          "commercially exploit Course materials."
        ]
      },
      {
        "type": "section",
        "num": "18",
        "title": "Personal Educational Use"
      },
      {
        "type": "paragraph",
        "text": "Students may generally use Course materials for legitimate personal study, subject to any additional restrictions disclosed by the Online Academy."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "viewing materials;",
          "taking personal notes;",
          "completing assessments;",
          "downloading permitted resources; and",
          "using the content as reasonably required for study."
        ]
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "COURSE RECORDINGS"
      },
      {
        "type": "section",
        "num": "19",
        "title": "Recorded Classes"
      },
      {
        "type": "paragraph",
        "text": "Where live classes are recorded, the Online Academy or Lecturer should ensure that recording is consistent with applicable:"
      },
      {
        "type": "list",
        "items": [
          "privacy requirements;",
          "Online Academy rules;",
          "consent requirements;",
          "intellectual property rights; and",
          "JIT Campus policies."
        ]
      },
      {
        "type": "section",
        "num": "20",
        "title": "Ownership of Recordings"
      },
      {
        "type": "paragraph",
        "text": "Ownership of a recorded class may depend on:"
      },
      {
        "type": "list",
        "items": [
          "who created the recording;",
          "the Online Academy-Lecturer agreement;",
          "applicable copyright law;",
          "Platform terms; and",
          "any separate contractual arrangements."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not automatically claim ownership merely because the recording is stored on the Platform."
      },
      {
        "type": "section",
        "num": "21",
        "title": "Student Recording"
      },
      {
        "type": "paragraph",
        "text": "Students must not record, copy or distribute private Course sessions contrary to:"
      },
      {
        "type": "list",
        "items": [
          "applicable law;",
          "Online Academy rules;",
          "Lecturer rights;",
          "other Students’ privacy; or",
          "JIT Campus policies."
        ]
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "ASSESSMENTS AND EXAMINATION MATERIALS"
      },
      {
        "type": "section",
        "num": "22",
        "title": "Assessment Content"
      },
      {
        "type": "paragraph",
        "text": "Assessment materials may be protected intellectual property."
      },
      {
        "type": "paragraph",
        "text": "Students must not unlawfully:"
      },
      {
        "type": "list",
        "items": [
          "sell examination questions;",
          "publish protected assessment banks;",
          "distribute answer keys;",
          "copy restricted test materials;",
          "reproduce confidential assessment content; or",
          "use assessment materials for commercial purposes without permission."
        ]
      },
      {
        "type": "section",
        "num": "23",
        "title": "Reuse by Online Academies"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may reuse their own assessment materials where they have the right to do so."
      },
      {
        "type": "paragraph",
        "text": "Users must not improperly copy another Online Academy’s assessment content."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "TRADEMARKS AND BRANDING"
      },
      {
        "type": "section",
        "num": "24",
        "title": "Online Academy Trademarks"
      },
      {
        "type": "paragraph",
        "text": "Online Academies remain responsible for ensuring that:"
      },
      {
        "type": "list",
        "items": [
          "their Online Academy name;",
          "logo;",
          "branding;",
          "Course names; and",
          "marketing materials"
        ]
      },
      {
        "type": "paragraph",
        "text": "do not knowingly infringe another party’s trademark or other intellectual property rights."
      },
      {
        "type": "section",
        "num": "25",
        "title": "Impersonating Existing Institutions"
      },
      {
        "type": "paragraph",
        "text": "Users must not use branding in a way that falsely makes an Online Academy appear to be an existing institution."
      },
      {
        "type": "paragraph",
        "text": "For example, a User must not copy the branding of a recognised university and create a misleadingly similar Online Academy on JIT Campus."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "THIRD-PARTY MATERIALS"
      },
      {
        "type": "section",
        "num": "26",
        "title": "Use of Third-Party Content"
      },
      {
        "type": "paragraph",
        "text": "Online Academies, Lecturers and Students may sometimes use third-party content for legitimate educational purposes."
      },
      {
        "type": "paragraph",
        "text": "Users remain responsible for complying with applicable:"
      },
      {
        "type": "list",
        "items": [
          "copyright requirements;",
          "licences;",
          "educational exceptions;",
          "quotation rules;",
          "attribution requirements; and",
          "other relevant legal requirements."
        ]
      },
      {
        "type": "section",
        "num": "27",
        "title": "Open-Licensed Material"
      },
      {
        "type": "paragraph",
        "text": "Users may use openly licensed material where they comply with the terms of the licence."
      },
      {
        "type": "paragraph",
        "text": "For example, a licence may require:"
      },
      {
        "type": "list",
        "items": [
          "attribution;",
          "a link to the licence;",
          "non-commercial use;",
          "share-alike distribution; or",
          "another condition."
        ]
      },
      {
        "type": "section",
        "num": "28",
        "title": "Publicly Available Does Not Mean Copyright-Free"
      },
      {
        "type": "paragraph",
        "text": "The fact that material can be found on the internet does not automatically mean that it may be copied and commercially redistributed."
      },
      {
        "type": "paragraph",
        "text": "Users should ensure they have a legitimate basis to use third-party material."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "SOFTWARE AND CODE"
      },
      {
        "type": "section",
        "num": "29",
        "title": "Software Content"
      },
      {
        "type": "paragraph",
        "text": "Where Courses involve software development, coding or technical education, Users must respect applicable software licences."
      },
      {
        "type": "paragraph",
        "text": "Users must not upload proprietary source code they are not authorised to disclose."
      },
      {
        "type": "section",
        "num": "30",
        "title": "Open-Source Software"
      },
      {
        "type": "paragraph",
        "text": "Open-source materials may be used according to their applicable licence conditions."
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "ARTIFICIAL INTELLIGENCE AND CONTENT"
      },
      {
        "type": "section",
        "num": "31",
        "title": "AI-Generated Content"
      },
      {
        "type": "paragraph",
        "text": "Online Academies and Lecturers may use AI-generated material where permitted and appropriate."
      },
      {
        "type": "paragraph",
        "text": "However, Users remain responsible for ensuring that their use does not knowingly violate:"
      },
      {
        "type": "list",
        "items": [
          "intellectual property rights;",
          "confidentiality;",
          "privacy;",
          "academic integrity; or",
          "applicable law."
        ]
      },
      {
        "type": "section",
        "num": "32",
        "title": "Responsibility for AI Output"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not guarantee that AI-generated content is free from intellectual property issues."
      },
      {
        "type": "paragraph",
        "text": "Users should review materials before publishing or commercially using them."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "CONTENT UPLOADED WITHOUT PERMISSION"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Infringing Content"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may remove or restrict access to content where there is a credible reason to believe that it infringes intellectual property rights."
      },
      {
        "type": "section",
        "num": "34",
        "title": "Repeat Infringement"
      },
      {
        "type": "paragraph",
        "text": "Users who repeatedly and knowingly upload infringing material may face:"
      },
      {
        "type": "list",
        "items": [
          "warnings;",
          "content restrictions;",
          "Course removal;",
          "feature restrictions;",
          "Account suspension; or",
          "termination."
        ]
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "REPORTING INTELLECTUAL PROPERTY INFRINGEMENT"
      },
      {
        "type": "section",
        "num": "35",
        "title": "Complaints"
      },
      {
        "type": "paragraph",
        "text": "A person who believes their intellectual property has been used unlawfully through JIT Campus may submit a complaint through the designated intellectual property or support channel."
      },
      {
        "type": "section",
        "num": "36",
        "title": "Information to Include"
      },
      {
        "type": "paragraph",
        "text": "A complaint should, where reasonably possible, include:"
      },
      {
        "type": "list",
        "items": [
          "complainant’s name;",
          "contact details;",
          "identification of the protected work;",
          "identification of the allegedly infringing content;",
          "relevant Online Academy or User;",
          "explanation of the rights claimed;",
          "evidence of ownership or authority where appropriate; and",
          "any other information reasonably necessary to review the complaint."
        ]
      },
      {
        "type": "section",
        "num": "37",
        "title": "Good-Faith Complaints"
      },
      {
        "type": "paragraph",
        "text": "Complaints should be made honestly."
      },
      {
        "type": "paragraph",
        "text": "Knowingly submitting a false intellectual-property complaint in order to remove legitimate content may constitute misuse of JIT Campus."
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "REVIEW OF A COMPLAINT"
      },
      {
        "type": "section",
        "num": "38",
        "title": "JIT Campus Review"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may review:"
      },
      {
        "type": "list",
        "items": [
          "the content;",
          "ownership claims;",
          "licences;",
          "User explanations;",
          "relevant Platform records;",
          "supporting documents; and",
          "other information reasonably necessary to assess the issue."
        ]
      },
      {
        "type": "section",
        "num": "39",
        "title": "Temporary Removal"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, content may be temporarily restricted while a serious intellectual property complaint is reviewed."
      },
      {
        "type": "paragraph",
        "text": "Temporary restriction does not automatically mean infringement has been established."
      },
      {
        "type": "section",
        "num": "40",
        "title": "User Response"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, the User who uploaded the content may be given an opportunity to:"
      },
      {
        "type": "list",
        "items": [
          "explain their right to use the material;",
          "provide a licence;",
          "show ownership;",
          "provide permission; or",
          "otherwise respond."
        ]
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "OUTCOMES"
      },
      {
        "type": "section",
        "num": "41",
        "title": "Possible Actions"
      },
      {
        "type": "paragraph",
        "text": "Following review, JIT Campus may:"
      },
      {
        "type": "list",
        "items": [
          "take no action;",
          "request further information;",
          "restore content;",
          "remove content;",
          "restrict access;",
          "require modification;",
          "issue a warning;",
          "suspend a Course;",
          "restrict an Account; or",
          "take another proportionate action."
        ]
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "DISPUTES BETWEEN ONLINE ACADEMIES AND LECTURERS"
      },
      {
        "type": "section",
        "num": "42",
        "title": "Ownership Disputes"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy and Lecturer may disagree about ownership of Course materials."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is not automatically responsible for deciding complex contractual ownership disputes between them."
      },
      {
        "type": "paragraph",
        "text": "The parties should ordinarily rely on:"
      },
      {
        "type": "list",
        "items": [
          "their agreement;",
          "employment terms;",
          "commissioning arrangements;",
          "applicable law; or",
          "appropriate dispute-resolution mechanisms."
        ]
      },
      {
        "type": "section",
        "num": "43",
        "title": "Platform Protection During a Dispute"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may temporarily restrict disputed material where necessary to prevent further harm while ownership is being clarified."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "DISPUTES INVOLVING STUDENT WORK"
      },
      {
        "type": "section",
        "num": "44",
        "title": "Student Ownership"
      },
      {
        "type": "paragraph",
        "text": "Online Academies and Lecturers should not automatically claim ownership of Student work merely because it was submitted for assessment."
      },
      {
        "type": "paragraph",
        "text": "Any broader ownership or commercial-use arrangement should have an appropriate legal basis and be clearly communicated."
      },
      {
        "type": "section",
        "num": "45",
        "title": "Academic Use"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may legitimately use Student submissions for:"
      },
      {
        "type": "list",
        "items": [
          "assessment;",
          "moderation;",
          "academic integrity checks;",
          "quality assurance;",
          "complaints;",
          "appeals; and",
          "academic recordkeeping"
        ]
      },
      {
        "type": "paragraph",
        "text": "where appropriate."
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "CERTIFICATES AND DESIGNS"
      },
      {
        "type": "section",
        "num": "46",
        "title": "Certificate Templates"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide certificate templates."
      },
      {
        "type": "paragraph",
        "text": "Ownership of the underlying JIT Campus template may remain with Jorsas Tech."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may add its own:"
      },
      {
        "type": "list",
        "items": [
          "logo;",
          "name;",
          "authorised signature;",
          "Course title;",
          "branding; and",
          "other permitted information."
        ]
      },
      {
        "type": "section",
        "num": "47",
        "title": "Online Academy Certificate Branding"
      },
      {
        "type": "paragraph",
        "text": "Online Academies remain responsible for ensuring that their certificate design does not falsely imply:"
      },
      {
        "type": "list",
        "items": [
          "government issuance;",
          "university accreditation;",
          "professional recognition;",
          "JIT Campus accreditation; or",
          "another status that does not exist."
        ]
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "USER-GENERATED CONTENT"
      },
      {
        "type": "section",
        "num": "48",
        "title": "Responsibility for Uploads"
      },
      {
        "type": "paragraph",
        "text": "Users are responsible for content they upload to JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not routinely pre-screen every item of User-generated content for copyright infringement."
      },
      {
        "type": "section",
        "num": "49",
        "title": "JIT Campus Action"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may act where infringement is identified or credibly reported."
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "CONTENT AFTER ACCOUNT OR ONLINE ACADEMY CLOSURE"
      },
      {
        "type": "section",
        "num": "50",
        "title": "Online Academy Closure"
      },
      {
        "type": "paragraph",
        "text": "When an Online Academy closes, access to Course materials may be restricted or removed depending on:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy settings;",
          "Student access rights;",
          "subscription status;",
          "legal requirements;",
          "data-retention requirements; and",
          "the relevant agreements."
        ]
      },
      {
        "type": "section",
        "num": "51",
        "title": "Technical Retention"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may retain technical copies of content for a reasonable period where necessary for:"
      },
      {
        "type": "list",
        "items": [
          "backups;",
          "legal obligations;",
          "dispute resolution;",
          "security;",
          "fraud prevention; or",
          "other legitimate operational purposes."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such retention does not transfer ownership of the content to Jorsas Tech."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "CONTENT EXPORTS"
      },
      {
        "type": "section",
        "num": "52",
        "title": "Downloaded Content"
      },
      {
        "type": "paragraph",
        "text": "Where Users are permitted to download or export content from JIT Campus, they remain responsible for how they use that content outside the Platform."
      },
      {
        "type": "paragraph",
        "text": "A download function does not automatically grant unlimited commercial rights."
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "NO GUARANTEE OF OWNERSHIP"
      },
      {
        "type": "section",
        "num": "53",
        "title": "User Representations"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may rely on Users’ representations that they have rights to upload their materials."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not guarantee that every User who uploads content is the lawful owner."
      },
      {
        "type": "section",
        "num": "54",
        "title": "Online Academy Due Diligence"
      },
      {
        "type": "paragraph",
        "text": "Online Academies should take reasonable care when using third-party or Lecturer-provided materials, particularly where they intend to commercially sell Courses."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "PLATFORM RIGHTS"
      },
      {
        "type": "section",
        "num": "55",
        "title": "Technical Modifications"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may technically modify content where reasonably necessary to provide the Service."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "compression;",
          "resizing;",
          "transcoding;",
          "formatting;",
          "thumbnail generation;",
          "backup;",
          "storage optimisation; or",
          "compatibility adjustments."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such technical processing does not mean that JIT Campus claims ownership of the underlying content."
      },
      {
        "type": "part",
        "label": "PART XXVI",
        "title": "TERMINATION FOR INTELLECTUAL PROPERTY ABUSE"
      },
      {
        "type": "section",
        "num": "56",
        "title": "Serious or Repeated Violations"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may suspend or terminate access where a User repeatedly or seriously:"
      },
      {
        "type": "list",
        "items": [
          "uploads pirated Courses;",
          "impersonates copyright owners;",
          "sells stolen content;",
          "repeatedly ignores legitimate infringement complaints;",
          "uses the Platform to distribute unlawful copies; or",
          "otherwise seriously abuses intellectual property rights."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVII",
        "title": "POLICY UPDATES"
      },
      {
        "type": "section",
        "num": "57",
        "title": "Changes to This Policy"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "new content features;",
          "changes to Course functionality;",
          "developments in artificial intelligence;",
          "changes in copyright law;",
          "new media formats;",
          "new content-sharing functionality; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "paragraph",
        "text": "The latest version will be published through JIT Campus."
      },
      {
        "type": "section",
        "num": "58",
        "title": "Relationship With Other Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Online Academy Owner and Online Academy Management Policy;",
          "Acceptable Use and Prohibited Activities Policy;",
          "Academic Integrity Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVIII",
        "title": "CONTACT"
      },
      {
        "type": "section",
        "num": "59",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "Questions concerning intellectual property or copyright on JIT Campus may be submitted through the designated JIT Campus support or intellectual-property channel."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Intellectual Property / Copyright: [Insert IP or legal email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "complaints-and-appeals",
    "title": "JIT CAMPUS COMPLAINTS, APPEALS AND DISPUTE RESOLUTION POLICY",
    "shortTitle": "Complaints & Appeals",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, deliver Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "This Complaints, Appeals and Dispute Resolution Policy (“Policy”) explains how complaints and disputes arising from the use of JIT Campus should be handled."
      },
      {
        "type": "paragraph",
        "text": "The Policy recognises an important distinction between:"
      },
      {
        "type": "paragraph",
        "text": "1. matters for which an individual Online Academy is responsible; and"
      },
      {
        "type": "paragraph",
        "text": "2. matters relating directly to the JIT Campus Platform or Jorsas Tech."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology and infrastructure. Individual Online Academies remain responsible for their own academic decisions, Courses, Lecturers, Admission Marketers, Student management and internal educational operations."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is therefore not automatically responsible for investigating or deciding every dispute arising between Users of an independent Online Academy."
      },
      {
        "type": "paragraph",
        "text": "However, JIT Campus may become directly involved where a complaint concerns Platform functionality, payments processed through JIT Campus, serious violations of JIT Campus rules, fraud, safeguarding, privacy, security or other significant Platform-related matters."
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "PURPOSE"
      },
      {
        "type": "section",
        "num": "2",
        "title": "Objectives"
      },
      {
        "type": "paragraph",
        "text": "This Policy aims to provide a process that is:"
      },
      {
        "type": "list",
        "items": [
          "accessible;",
          "proportionate;",
          "reasonably fair;",
          "transparent;",
          "appropriate to the nature of the complaint; and",
          "clear about whether responsibility lies with the Online Academy or JIT Campus."
        ]
      },
      {
        "type": "section",
        "num": "3",
        "title": "Who May Raise a Complaint?"
      },
      {
        "type": "paragraph",
        "text": "Depending on the circumstances, complaints may be raised by:"
      },
      {
        "type": "list",
        "items": [
          "Students;",
          "prospective Students;",
          "Online Academy Owners;",
          "Lecturers;",
          "Admission Marketers; and",
          "other Users affected by activities conducted through JIT Campus."
        ]
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "WHAT IS A COMPLAINT?"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Definition"
      },
      {
        "type": "paragraph",
        "text": "A complaint is an expression of dissatisfaction concerning a Service, decision, action, omission, User or activity connected with JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "A complaint may concern matters such as:"
      },
      {
        "type": "list",
        "items": [
          "Course delivery;",
          "Lecturer conduct;",
          "Admission Marketer conduct;",
          "Student behaviour;",
          "admission processes;",
          "payments;",
          "refunds;",
          "Platform functionality;",
          "harassment;",
          "safeguarding;",
          "privacy;",
          "fraud;",
          "Account restrictions; or",
          "other Platform-related matters."
        ]
      },
      {
        "type": "paragraph",
        "text": "Not every request for assistance is necessarily a formal complaint."
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "ONLINE ACADEMY MATTERS AND JIT CAMPUS MATTERS"
      },
      {
        "type": "section",
        "num": "5",
        "title": "Online Academy-Level Matters"
      },
      {
        "type": "paragraph",
        "text": "The following matters should normally be raised with the relevant Online Academy first:"
      },
      {
        "type": "list",
        "items": [
          "Course content;",
          "teaching quality;",
          "Lecturer performance;",
          "grades;",
          "assessment decisions;",
          "Course-specific admission decisions;",
          "attendance;",
          "Student progression;",
          "Online Academy certificates;",
          "Online Academy-specific refund decisions;",
          "Course scheduling;",
          "internal Student discipline;",
          "Online Academy-specific academic rules; and",
          "ordinary disputes between Users within the Online Academy."
        ]
      },
      {
        "type": "paragraph",
        "text": "These matters are generally within the Online Academy’s control."
      },
      {
        "type": "section",
        "num": "6",
        "title": "JIT Campus Matters"
      },
      {
        "type": "paragraph",
        "text": "Complaints may be raised directly with JIT Campus where they concern:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus technical functionality;",
          "Account access;",
          "Platform security;",
          "JIT Campus charges;",
          "payment-processing issues within JIT Campus’s control;",
          "privacy or data protection concerning JIT Campus;",
          "serious Platform abuse;",
          "fraud;",
          "impersonation;",
          "serious harassment;",
          "safeguarding;",
          "false claims involving JIT Campus;",
          "suspension or termination by JIT Campus; or",
          "other matters directly within JIT Campus’s control."
        ]
      },
      {
        "type": "section",
        "num": "7",
        "title": "Serious Matters"
      },
      {
        "type": "paragraph",
        "text": "A User does not need to complete an Online Academy’s internal complaint process before contacting JIT Campus where the matter involves a serious concern such as:"
      },
      {
        "type": "list",
        "items": [
          "child exploitation;",
          "grooming;",
          "credible threats of serious violence;",
          "serious sexual harassment;",
          "suspected systematic fraud;",
          "significant privacy or security breaches;",
          "malicious Account takeover;",
          "unlawful Platform activity; or",
          "serious misconduct by the Online Academy itself."
        ]
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "ONLINE ACADEMY COMPLAINT PROCEDURES"
      },
      {
        "type": "section",
        "num": "8",
        "title": "Online Academy Responsibility"
      },
      {
        "type": "paragraph",
        "text": "Online Academies are encouraged to provide Students with a reasonable method for raising concerns."
      },
      {
        "type": "paragraph",
        "text": "Depending on the size and nature of the Online Academy, this may be:"
      },
      {
        "type": "list",
        "items": [
          "an in-Platform complaint function;",
          "a designated Online Academy administrator;",
          "an email address;",
          "an Online Academy Owner;",
          "an academic administrator; or",
          "another appropriate mechanism."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not require every small Online Academy to establish a complex complaints department."
      },
      {
        "type": "section",
        "num": "9",
        "title": "Proportionate Procedures"
      },
      {
        "type": "paragraph",
        "text": "A small independent training provider may use a relatively simple complaint process."
      },
      {
        "type": "paragraph",
        "text": "A larger or regulated educational institution may require a more detailed process."
      },
      {
        "type": "paragraph",
        "text": "Online Academies are responsible for determining what additional procedures are appropriate or legally required for their activities."
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "RAISING A COMPLAINT WITH JIT CAMPUS"
      },
      {
        "type": "section",
        "num": "10",
        "title": "Submitting a Complaint"
      },
      {
        "type": "paragraph",
        "text": "Where a matter falls within JIT Campus’s responsibility, Users may submit a complaint through the designated JIT Campus support or complaint channel."
      },
      {
        "type": "paragraph",
        "text": "Where possible, the complaint should include:"
      },
      {
        "type": "list",
        "items": [
          "the complainant’s name;",
          "Account email or relevant Account information;",
          "relevant Online Academy;",
          "relevant Course where applicable;",
          "description of the issue;",
          "relevant dates;",
          "steps already taken;",
          "supporting evidence where available; and",
          "the outcome sought."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users should not put themselves at risk simply to obtain evidence."
      },
      {
        "type": "section",
        "num": "11",
        "title": "Complaint Reference"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate and technically available, JIT Campus may assign a reference number or other identifier to a complaint."
      },
      {
        "type": "paragraph",
        "text": "This may be used to track the matter."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "INITIAL ASSESSMENT"
      },
      {
        "type": "section",
        "num": "12",
        "title": "Determining Responsibility"
      },
      {
        "type": "paragraph",
        "text": "When JIT Campus receives a complaint, it may first determine whether the matter is:"
      },
      {
        "type": "list",
        "items": [
          "primarily an Online Academy matter;",
          "primarily a JIT Campus matter;",
          "a matter involving both;",
          "a safeguarding concern;",
          "a privacy concern;",
          "a security concern;",
          "a financial dispute; or",
          "another type of issue."
        ]
      },
      {
        "type": "section",
        "num": "13",
        "title": "Referring a Matter to the Online Academy"
      },
      {
        "type": "paragraph",
        "text": "Where the complaint concerns a matter that should reasonably be handled by the Online Academy, JIT Campus may direct the complainant to the relevant Online Academy."
      },
      {
        "type": "paragraph",
        "text": "For example, JIT Campus would not ordinarily determine whether a Lecturer should have awarded a Student 65% rather than 70%."
      },
      {
        "type": "paragraph",
        "text": "That is normally an academic matter for the Online Academy."
      },
      {
        "type": "section",
        "num": "14",
        "title": "JIT Campus Retaining a Matter"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may retain or independently investigate a complaint where the issue:"
      },
      {
        "type": "list",
        "items": [
          "concerns JIT Campus directly;",
          "involves mandatory Platform rules;",
          "creates a serious safety concern;",
          "affects multiple Online Academies;",
          "involves suspected fraud;",
          "concerns Platform security;",
          "concerns JIT Campus’s processing of personal information; or",
          "otherwise requires Platform-level intervention."
        ]
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "INFORMAL RESOLUTION"
      },
      {
        "type": "section",
        "num": "15",
        "title": "Resolving Issues Early"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, Users and Online Academies are encouraged to resolve straightforward problems informally."
      },
      {
        "type": "paragraph",
        "text": "Examples may include:"
      },
      {
        "type": "list",
        "items": [
          "correcting incorrect Course information;",
          "resolving a scheduling error;",
          "correcting a payment status;",
          "restoring legitimate Account access;",
          "clarifying an admission requirement; or",
          "correcting an administrative mistake."
        ]
      },
      {
        "type": "paragraph",
        "text": "An issue does not need to become a lengthy formal dispute where it can reasonably be corrected quickly."
      },
      {
        "type": "section",
        "num": "16",
        "title": "No Requirement for Informal Resolution in Serious Cases"
      },
      {
        "type": "paragraph",
        "text": "Informal resolution is not required where the allegation involves serious matters such as:"
      },
      {
        "type": "list",
        "items": [
          "sexual exploitation;",
          "child safeguarding;",
          "threats of serious violence;",
          "serious fraud;",
          "serious harassment;",
          "serious privacy violations; or",
          "significant security incidents."
        ]
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "INVESTIGATION"
      },
      {
        "type": "section",
        "num": "17",
        "title": "Information JIT Campus May Review"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus investigates a complaint, it may review information reasonably relevant to the matter."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "Account records;",
          "Platform activity;",
          "messages sent through JIT Campus;",
          "payment records;",
          "Course information;",
          "submission timestamps;",
          "Account permissions;",
          "uploaded content;",
          "relevant technical logs;",
          "previous reports; and",
          "information provided by the parties."
        ]
      },
      {
        "type": "section",
        "num": "18",
        "title": "Requesting Further Information"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may request additional information from:"
      },
      {
        "type": "list",
        "items": [
          "the complainant;",
          "the Online Academy;",
          "the Lecturer;",
          "the Admission Marketer;",
          "the Student; or",
          "another relevant User."
        ]
      },
      {
        "type": "paragraph",
        "text": "Failure to respond may affect JIT Campus’s ability to investigate the matter."
      },
      {
        "type": "section",
        "num": "19",
        "title": "Fairness"
      },
      {
        "type": "paragraph",
        "text": "Where an allegation may result in significant action against another User, that User should ordinarily be given a reasonable opportunity to respond."
      },
      {
        "type": "paragraph",
        "text": "However, temporary restrictions may be imposed before a response is received where necessary to protect:"
      },
      {
        "type": "list",
        "items": [
          "Users;",
          "children;",
          "vulnerable persons;",
          "evidence;",
          "funds;",
          "personal information;",
          "Platform security; or",
          "JIT Campus operations."
        ]
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "COMPLAINT OUTCOMES"
      },
      {
        "type": "section",
        "num": "20",
        "title": "Possible Outcomes"
      },
      {
        "type": "paragraph",
        "text": "Depending on the complaint, an outcome may include:"
      },
      {
        "type": "list",
        "items": [
          "explanation;",
          "clarification;",
          "correction of an error;",
          "technical assistance;",
          "restoration of access;",
          "payment correction;",
          "refund where appropriate;",
          "content removal;",
          "warning;",
          "feature restriction;",
          "referral back to the Online Academy;",
          "temporary Account suspension;",
          "Online Academy suspension;",
          "Account termination;",
          "referral to another appropriate process; or",
          "no further action where the complaint is not substantiated."
        ]
      },
      {
        "type": "section",
        "num": "21",
        "title": "No Guaranteed Outcome"
      },
      {
        "type": "paragraph",
        "text": "Submitting a complaint does not guarantee that JIT Campus will:"
      },
      {
        "type": "list",
        "items": [
          "agree with the complainant;",
          "provide compensation;",
          "issue a refund;",
          "suspend another User;",
          "remove an Online Academy; or",
          "overturn an academic decision."
        ]
      },
      {
        "type": "paragraph",
        "text": "The outcome depends on the circumstances and the responsibilities of JIT Campus and the relevant Online Academy."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "ACADEMIC APPEALS"
      },
      {
        "type": "section",
        "num": "22",
        "title": "Academic Decisions"
      },
      {
        "type": "paragraph",
        "text": "Academic decisions are generally the responsibility of the relevant Online Academy."
      },
      {
        "type": "paragraph",
        "text": "These include:"
      },
      {
        "type": "list",
        "items": [
          "grades;",
          "assessment results;",
          "Course progression;",
          "resits;",
          "academic misconduct findings;",
          "Course completion; and",
          "Online Academy-issued certification."
        ]
      },
      {
        "type": "section",
        "num": "23",
        "title": "Online Academy Appeals"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may establish processes allowing Students to challenge academic decisions."
      },
      {
        "type": "paragraph",
        "text": "Possible grounds may include:"
      },
      {
        "type": "list",
        "items": [
          "procedural error;",
          "incorrect calculation;",
          "relevant evidence not considered;",
          "bias;",
          "irregular assessment procedure; or",
          "another ground recognised by the Online Academy."
        ]
      },
      {
        "type": "section",
        "num": "24",
        "title": "Academic Judgment"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not ordinarily substitute its judgment for that of an Online Academy or Lecturer concerning academic quality."
      },
      {
        "type": "paragraph",
        "text": "For example, JIT Campus will not normally decide whether a Student’s essay deserved a particular grade."
      },
      {
        "type": "section",
        "num": "25",
        "title": "Platform Issues Affecting Academic Decisions"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may investigate where the complaint concerns whether the Platform itself malfunctioned."
      },
      {
        "type": "paragraph",
        "text": "For example:"
      },
      {
        "type": "list",
        "items": [
          "a submission was incorrectly timestamped;",
          "an assessment became unavailable because of a verified Platform failure;",
          "a grade was altered through unauthorised Account access; or",
          "Platform data relevant to an appeal is incorrect."
        ]
      },
      {
        "type": "paragraph",
        "text": "The Online Academy remains responsible for the resulting academic decision."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "APPEALS AGAINST JIT CAMPUS DECISIONS"
      },
      {
        "type": "section",
        "num": "26",
        "title": "Platform-Level Appeals"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus takes significant action against a User, the User may request review where appropriate."
      },
      {
        "type": "paragraph",
        "text": "This may include decisions involving:"
      },
      {
        "type": "list",
        "items": [
          "Account suspension;",
          "Account termination;",
          "Online Academy suspension;",
          "removal of significant content;",
          "payment restrictions; or",
          "another substantial Platform-level action."
        ]
      },
      {
        "type": "section",
        "num": "27",
        "title": "Grounds for Review"
      },
      {
        "type": "paragraph",
        "text": "A User may request review where they believe:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus relied on materially incorrect information;",
          "relevant evidence was not considered;",
          "the wrong Account was identified;",
          "the decision resulted from a technical error;",
          "significant new information is available; or",
          "the action was materially disproportionate."
        ]
      },
      {
        "type": "section",
        "num": "28",
        "title": "Repeated Appeals"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is not required to repeatedly reconsider the same matter where:"
      },
      {
        "type": "list",
        "items": [
          "a final review has been completed;",
          "no material new information has been provided; and",
          "the User is simply repeating the same disagreement."
        ]
      },
      {
        "type": "paragraph",
        "text": "This does not prevent Users from exercising rights available under applicable law."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "PAYMENT AND REFUND DISPUTES"
      },
      {
        "type": "section",
        "num": "29",
        "title": "Course Payment Disputes"
      },
      {
        "type": "paragraph",
        "text": "Where a dispute concerns the price or refund conditions of a particular Online Academy’s Course, the Student should ordinarily contact the Online Academy first."
      },
      {
        "type": "paragraph",
        "text": "The Online Academy remains responsible for its own Course pricing and applicable refund terms."
      },
      {
        "type": "section",
        "num": "30",
        "title": "JIT Campus Payment Issues"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may investigate issues involving:"
      },
      {
        "type": "list",
        "items": [
          "duplicate transactions;",
          "payment-processing errors;",
          "incorrect Platform charges;",
          "payout errors;",
          "suspected payment fraud; or",
          "other payment issues within JIT Campus’s control."
        ]
      },
      {
        "type": "section",
        "num": "31",
        "title": "Chargebacks"
      },
      {
        "type": "paragraph",
        "text": "Chargebacks may be handled according to the Fees, Payments, Refunds and Cancellation Policy and the applicable payment provider’s procedures."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide relevant transaction evidence where appropriate."
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "COMPLAINTS ABOUT ONLINE ACADEMY OWNERS"
      },
      {
        "type": "section",
        "num": "32",
        "title": "Online Academy Owner Conduct"
      },
      {
        "type": "paragraph",
        "text": "Users may report an Online Academy Owner to JIT Campus where there is a credible allegation involving:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "serious misrepresentation;",
          "false accreditation claims;",
          "systematic non-delivery of paid Courses;",
          "serious privacy violations;",
          "safeguarding;",
          "serious harassment;",
          "manipulation of Platform records; or",
          "another serious breach of JIT Campus rules."
        ]
      },
      {
        "type": "section",
        "num": "33",
        "title": "Online Academy Quality Complaints"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not automatically guarantee the quality of every independent Online Academy."
      },
      {
        "type": "paragraph",
        "text": "General dissatisfaction with teaching quality should ordinarily be raised with the Online Academy."
      },
      {
        "type": "paragraph",
        "text": "However, repeated complaints indicating potential fraud or serious misrepresentation may justify Platform-level review."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "COMPLAINTS ABOUT LECTURERS"
      },
      {
        "type": "section",
        "num": "34",
        "title": "Lecturer Complaints"
      },
      {
        "type": "paragraph",
        "text": "Ordinary complaints about Lecturers should generally be handled by the Online Academy that appointed them."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may intervene where conduct involves:"
      },
      {
        "type": "list",
        "items": [
          "safeguarding;",
          "serious harassment;",
          "fraud;",
          "serious privacy violations;",
          "Platform security;",
          "falsification of Platform records; or",
          "another serious Platform violation."
        ]
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "COMPLAINTS ABOUT ADMISSION MARKETERS"
      },
      {
        "type": "section",
        "num": "35",
        "title": "Admission Marketer Complaints"
      },
      {
        "type": "paragraph",
        "text": "Online Academies are ordinarily responsible for their Admission Marketers."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may intervene where an Admission Marketer is alleged to have engaged in:"
      },
      {
        "type": "list",
        "items": [
          "serious fraud;",
          "systematic misrepresentation;",
          "false accreditation claims;",
          "unauthorised payment collection;",
          "serious harassment;",
          "safeguarding violations;",
          "serious misuse of applicant information; or",
          "Platform manipulation."
        ]
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "SAFEGUARDING COMPLAINTS"
      },
      {
        "type": "section",
        "num": "36",
        "title": "Priority Handling"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding concerns should be treated according to their seriousness and potential risk."
      },
      {
        "type": "paragraph",
        "text": "Where there is an immediate risk, JIT Campus may take protective action before completing a full investigation."
      },
      {
        "type": "section",
        "num": "37",
        "title": "External Authorities"
      },
      {
        "type": "paragraph",
        "text": "Jorsas Tech may refer serious safeguarding, criminal, fraud or security matters to competent authorities where required or permitted by law."
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "PRIVACY COMPLAINTS"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Privacy and Personal Information"
      },
      {
        "type": "paragraph",
        "text": "Users may raise concerns regarding how their personal information is handled."
      },
      {
        "type": "paragraph",
        "text": "Privacy complaints relating to JIT Campus should be directed through the appropriate JIT Campus privacy contact."
      },
      {
        "type": "paragraph",
        "text": "Where a concern relates primarily to how an independent Online Academy uses information under its own responsibility, the User may also need to contact that Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Further information is available in the JIT Campus Privacy Policy."
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "CONFIDENTIALITY"
      },
      {
        "type": "section",
        "num": "39",
        "title": "Complaint Information"
      },
      {
        "type": "paragraph",
        "text": "Complaint information should be handled with appropriate confidentiality."
      },
      {
        "type": "paragraph",
        "text": "Information may be shared where reasonably necessary for:"
      },
      {
        "type": "list",
        "items": [
          "investigation;",
          "obtaining a response;",
          "safeguarding;",
          "legal compliance;",
          "payment dispute resolution;",
          "security;",
          "disciplinary action; or",
          "another legitimate purpose."
        ]
      },
      {
        "type": "paragraph",
        "text": "Absolute confidentiality cannot be guaranteed."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "RETALIATION"
      },
      {
        "type": "section",
        "num": "40",
        "title": "Protection From Retaliation"
      },
      {
        "type": "paragraph",
        "text": "Users must not retaliate against another person merely because that person:"
      },
      {
        "type": "list",
        "items": [
          "made a genuine complaint;",
          "requested a review;",
          "participated in an investigation;",
          "provided evidence;",
          "raised a safeguarding concern; or",
          "exercised a legitimate legal right."
        ]
      },
      {
        "type": "paragraph",
        "text": "Retaliation may itself constitute misconduct."
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "FALSE OR MALICIOUS COMPLAINTS"
      },
      {
        "type": "section",
        "num": "41",
        "title": "Unsuccessful Complaints"
      },
      {
        "type": "paragraph",
        "text": "A complaint is not malicious merely because it is not upheld."
      },
      {
        "type": "paragraph",
        "text": "Users should be able to raise genuine concerns without fear of punishment simply because evidence is insufficient."
      },
      {
        "type": "section",
        "num": "42",
        "title": "Deliberately False Complaints"
      },
      {
        "type": "paragraph",
        "text": "Where there is clear evidence that a User knowingly fabricated a serious allegation for the purpose of harming another User, JIT Campus or the relevant Online Academy may take appropriate action."
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "COMPLAINT TIMESCALES"
      },
      {
        "type": "section",
        "num": "43",
        "title": "Response Times"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus aims to acknowledge and handle complaints within reasonable periods according to their nature and complexity."
      },
      {
        "type": "paragraph",
        "text": "Different matters may require different timescales."
      },
      {
        "type": "paragraph",
        "text": "For example:"
      },
      {
        "type": "list",
        "items": [
          "simple technical issues may be resolved quickly;",
          "payment investigations may depend on a payment provider;",
          "safeguarding cases may require urgent action;",
          "complex fraud investigations may require additional time."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should avoid promising an unrealistic universal resolution period for every type of complaint."
      },
      {
        "type": "section",
        "num": "44",
        "title": "Updates"
      },
      {
        "type": "paragraph",
        "text": "Where a significant investigation cannot be concluded promptly, JIT Campus may provide appropriate status updates where reasonably practicable."
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "EVIDENCE AND RECORDS"
      },
      {
        "type": "section",
        "num": "45",
        "title": "Complaint Records"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may maintain appropriate records concerning:"
      },
      {
        "type": "list",
        "items": [
          "complaints;",
          "supporting evidence;",
          "communications;",
          "investigation steps;",
          "decisions;",
          "appeals;",
          "refunds;",
          "Account actions; and",
          "final outcomes."
        ]
      },
      {
        "type": "paragraph",
        "text": "Records will be retained according to applicable legal, operational and data protection requirements."
      },
      {
        "type": "section",
        "num": "46",
        "title": "Platform Evidence"
      },
      {
        "type": "paragraph",
        "text": "Where relevant, Platform-generated information such as:"
      },
      {
        "type": "list",
        "items": [
          "timestamps;",
          "transaction records;",
          "Account activity;",
          "permission changes;",
          "submissions; and",
          "communication records"
        ]
      },
      {
        "type": "paragraph",
        "text": "may be considered during an investigation."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "EXTERNAL DISPUTE RESOLUTION"
      },
      {
        "type": "section",
        "num": "47",
        "title": "Legal Rights"
      },
      {
        "type": "paragraph",
        "text": "Nothing in this Policy is intended to prevent a User from exercising rights available under applicable law."
      },
      {
        "type": "paragraph",
        "text": "Users may have rights to contact:"
      },
      {
        "type": "list",
        "items": [
          "consumer protection bodies;",
          "data protection authorities;",
          "law enforcement;",
          "courts;",
          "regulators; or",
          "other competent authorities,"
        ]
      },
      {
        "type": "paragraph",
        "text": "depending on the nature of the issue and applicable jurisdiction."
      },
      {
        "type": "section",
        "num": "48",
        "title": "Cooperation"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate and legally required, Jorsas Tech may cooperate with competent authorities concerning legitimate investigations or legal processes."
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "ABUSE OF THE COMPLAINT SYSTEM"
      },
      {
        "type": "section",
        "num": "49",
        "title": "Misuse"
      },
      {
        "type": "paragraph",
        "text": "Users must not misuse the complaints process to:"
      },
      {
        "type": "list",
        "items": [
          "repeatedly harass another User;",
          "submit automated spam complaints;",
          "knowingly fabricate evidence;",
          "threaten Users;",
          "extort money;",
          "manipulate refunds;",
          "interfere with Platform operations; or",
          "pursue another abusive purpose."
        ]
      },
      {
        "type": "paragraph",
        "text": "Reasonable restrictions may be placed on abusive use of complaint channels without preventing legitimate complaints."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "ONLINE ACADEMY COMPLAINT MANAGEMENT TOOLS"
      },
      {
        "type": "section",
        "num": "50",
        "title": "Platform Functionality"
      },
      {
        "type": "paragraph",
        "text": "Where available, JIT Campus may provide Online Academies with tools to:"
      },
      {
        "type": "list",
        "items": [
          "receive complaints;",
          "assign cases;",
          "record responses;",
          "attach evidence;",
          "change complaint status;",
          "record decisions;",
          "manage appeals; and",
          "maintain appropriate audit trails."
        ]
      },
      {
        "type": "paragraph",
        "text": "Use of these tools does not make JIT Campus the decision-maker for the Online Academy’s complaint."
      },
      {
        "type": "section",
        "num": "51",
        "title": "Suggested Complaint Statuses"
      },
      {
        "type": "paragraph",
        "text": "Where supported, Online Academy or JIT Campus complaints may use statuses such as:"
      },
      {
        "type": "paragraph",
        "text": "Submitted → Under Review → Information Required → Investigation → Decision Issued → Appeal/Review → Closed"
      },
      {
        "type": "paragraph",
        "text": "Not every complaint must go through every stage."
      },
      {
        "type": "part",
        "label": "PART XXVI",
        "title": "JIT CAMPUS’S ROLE"
      },
      {
        "type": "section",
        "num": "52",
        "title": "Platform Provider"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides infrastructure connecting Online Academies, Students, Lecturers and Admission Marketers."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is not the automatic adjudicator of every disagreement occurring within an independent Online Academy."
      },
      {
        "type": "paragraph",
        "text": "The relevant Online Academy remains responsible for its:"
      },
      {
        "type": "list",
        "items": [
          "academic decisions;",
          "Lecturer management;",
          "Admission Marketer management;",
          "Course delivery;",
          "internal Student matters; and",
          "Online Academy-specific policies."
        ]
      },
      {
        "type": "section",
        "num": "53",
        "title": "Platform-Level Responsibility"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus retains responsibility for matters within its own control and may act where necessary to protect:"
      },
      {
        "type": "list",
        "items": [
          "Platform security;",
          "Users;",
          "payment integrity;",
          "personal information;",
          "JIT Campus systems;",
          "Platform rules; and",
          "the lawful operation of the Service."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVII",
        "title": "CHANGES TO THIS POLICY"
      },
      {
        "type": "section",
        "num": "54",
        "title": "Policy Updates"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "changes to Platform functionality;",
          "new complaint-management tools;",
          "changes to payment functionality;",
          "legal or regulatory developments;",
          "emerging safety risks; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "paragraph",
        "text": "The latest version will be published through JIT Campus."
      },
      {
        "type": "section",
        "num": "55",
        "title": "Relationship With Online Academy Policies"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may maintain their own complaints and appeals procedures."
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy’s procedure concerns matters within that Online Academy, the Online Academy’s procedure will ordinarily apply."
      },
      {
        "type": "paragraph",
        "text": "Where the matter concerns mandatory JIT Campus Platform rules, JIT Campus may apply its own procedures independently."
      },
      {
        "type": "section",
        "num": "56",
        "title": "Relationship With Other JIT Campus Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Cookie Policy;",
          "Admissions and Enrolment Policy;",
          "Fees, Payments, Refunds and Cancellation Policy;",
          "Academic Regulations and Assessment Policy;",
          "Academic Integrity Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct; and",
          "Safeguarding, Equality and Anti-Harassment Policy."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVIII",
        "title": "CONTACT"
      },
      {
        "type": "section",
        "num": "57",
        "title": "Contacting JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Questions or complaints concerning JIT Campus itself may be submitted through the designated JIT Campus contact channel."
      },
      {
        "type": "paragraph",
        "text": "Complaints concerning an individual Online Academy’s Course, Lecturer, assessment or admission decision should ordinarily be directed to that Online Academy first unless the complaint involves a serious Platform-level issue."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Complaints: [Insert complaints email]"
      },
      {
        "type": "paragraph",
        "text": "Privacy: [Insert privacy email]"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding: [Insert safeguarding email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "school-owner-management",
    "title": "JIT CAMPUS ONLINE ACADEMY OWNER AND ONLINE ACADEMY MANAGEMENT POLICY",
    "shortTitle": "Online Academy Owner & Management",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, create Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "This Online Academy Owner and Online Academy Management Policy (“Policy”) sets out the responsibilities of individuals and organisations that create, own, administer or manage Online Academies through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology and infrastructure that enables an Online Academy Owner to establish and operate a digital Online Academy."
      },
      {
        "type": "paragraph",
        "text": "The Online Academy Owner remains responsible for the operation of their Online Academy, the information they publish, the Users they appoint, the Courses they provide and the educational services delivered through their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not ordinarily require identity documents, academic certificates, company-registration documents or accreditation documents before a User creates an Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Instead, Users who create Online Academies are required to comply with this Policy, the JIT Campus Terms and Conditions and other applicable Platform rules."
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "WHO IS AN ONLINE ACADEMY OWNER?"
      },
      {
        "type": "section",
        "num": "2",
        "title": "Definition"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy Owner is a User who creates an Online Academy through JIT Campus or is otherwise granted ownership-level control over an Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Depending on available functionality, an Online Academy Owner may be:"
      },
      {
        "type": "list",
        "items": [
          "an individual;",
          "an independent Lecturer;",
          "a trainer;",
          "an educational entrepreneur;",
          "a training organisation;",
          "an academy;",
          "a company;",
          "an existing educational institution;",
          "a professional training provider; or",
          "another person or organisation permitted to operate through JIT Campus."
        ]
      },
      {
        "type": "section",
        "num": "3",
        "title": "Meaning of “Online Academy”"
      },
      {
        "type": "paragraph",
        "text": "For JIT Campus purposes, the term “Online Academy” is a Platform designation for an educational or training environment created through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may provide:"
      },
      {
        "type": "list",
        "items": [
          "academic Courses;",
          "professional training;",
          "vocational training;",
          "technology training;",
          "coaching;",
          "tutorials;",
          "skills development;",
          "certification Courses;",
          "professional development;",
          "short Courses; or",
          "other legitimate educational activities."
        ]
      },
      {
        "type": "paragraph",
        "text": "The use of the word “Online Academy” on JIT Campus does not automatically mean that the provider is formally registered, accredited, government-approved or authorised to award regulated qualifications."
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "CREATING AN ONLINE ACADEMY"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Basic Account Requirements"
      },
      {
        "type": "paragraph",
        "text": "A User may create an Online Academy after satisfying the normal JIT Campus Account-registration requirements."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "full name;",
          "email address;",
          "telephone number;",
          "password; and",
          "other basic Account information reasonably required to operate JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not ordinarily require a User to provide:"
      },
      {
        "type": "list",
        "items": [
          "passport;",
          "national identification card;",
          "business-registration certificate;",
          "academic certificate;",
          "professional certificate;",
          "accreditation certificate; or",
          "other formal verification documents"
        ]
      },
      {
        "type": "paragraph",
        "text": "simply to create an Online Academy."
      },
      {
        "type": "section",
        "num": "5",
        "title": "Online Academy Creation Information"
      },
      {
        "type": "paragraph",
        "text": "When creating an Online Academy, the Online Academy Owner may be asked to provide information including:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy name;",
          "Online Academy description;",
          "logo;",
          "subject or learning category;",
          "Online Academy contact details;",
          "location where relevant;",
          "Courses or Programmes;",
          "Online Academy branding; and",
          "other information necessary to configure the Online Academy."
        ]
      },
      {
        "type": "section",
        "num": "6",
        "title": "Online Academy Owner Declaration"
      },
      {
        "type": "paragraph",
        "text": "By creating an Online Academy, the Online Academy Owner confirms that:"
      },
      {
        "type": "list",
        "items": [
          "they have authority to create and operate the Online Academy;",
          "the information they provide will not knowingly be false or misleading;",
          "they will comply with JIT Campus policies;",
          "they will take responsibility for Users appointed to privileged roles within their Online Academy;",
          "they will not falsely claim accreditation or regulatory approval; and",
          "they will operate their Online Academy for legitimate purposes."
        ]
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "ONLINE ACADEMY NAMES AND IDENTITY"
      },
      {
        "type": "section",
        "num": "7",
        "title": "Online Academy Names"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners may choose an Online Academy name, provided the name does not knowingly:"
      },
      {
        "type": "list",
        "items": [
          "impersonate another organisation;",
          "infringe another person’s trademark or intellectual property;",
          "falsely imply government ownership;",
          "falsely imply association with Jorsas Tech;",
          "falsely imply accreditation;",
          "deliberately mislead Students; or",
          "facilitate fraud."
        ]
      },
      {
        "type": "section",
        "num": "8",
        "title": "Existing Institution Names"
      },
      {
        "type": "paragraph",
        "text": "A User must not create an Online Academy pretending to be an existing university, college, academy, company or other organisation without appropriate authority."
      },
      {
        "type": "paragraph",
        "text": "For example, a User must not create an Online Academy called:"
      },
      {
        "type": "paragraph",
        "text": "“University of Oxford Official Campus”"
      },
      {
        "type": "paragraph",
        "text": "if they have no authority to represent that institution."
      },
      {
        "type": "section",
        "num": "9",
        "title": "JIT Campus Branding"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must not represent their Online Academy as:"
      },
      {
        "type": "list",
        "items": [
          "owned by JIT Campus;",
          "owned by Jorsas Tech;",
          "accredited by JIT Campus;",
          "officially certified by JIT Campus; or",
          "a branch of Jorsas Tech"
        ]
      },
      {
        "type": "paragraph",
        "text": "unless expressly authorised."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy may accurately state that it uses JIT Campus or is hosted on JIT Campus, where appropriate."
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "ONLINE ACADEMY INFORMATION"
      },
      {
        "type": "section",
        "num": "10",
        "title": "Accuracy"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for information published about their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "This includes information about:"
      },
      {
        "type": "list",
        "items": [
          "Courses;",
          "fees;",
          "Course duration;",
          "Lecturers;",
          "certificates;",
          "admission requirements;",
          "Course outcomes;",
          "accreditation;",
          "professional recognition;",
          "partnerships; and",
          "other material information."
        ]
      },
      {
        "type": "section",
        "num": "11",
        "title": "Misleading Information"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must not deliberately publish false or misleading claims intended to persuade Students to enrol."
      },
      {
        "type": "paragraph",
        "text": "Examples include falsely claiming:"
      },
      {
        "type": "list",
        "items": [
          "guaranteed employment;",
          "guaranteed immigration outcomes;",
          "government accreditation;",
          "university recognition;",
          "professional licensing;",
          "guaranteed income;",
          "guaranteed admission elsewhere; or",
          "qualifications the Online Academy is not authorised to issue."
        ]
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "ONLINE ACADEMY ACCREDITATION AND REGULATORY STATUS"
      },
      {
        "type": "section",
        "num": "12",
        "title": "No Automatic JIT Verification"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not routinely investigate whether every Online Academy is:"
      },
      {
        "type": "list",
        "items": [
          "registered;",
          "accredited;",
          "licensed;",
          "professionally recognised;",
          "regulated; or",
          "approved by a government authority."
        ]
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners remain responsible for the claims they make about their status."
      },
      {
        "type": "section",
        "num": "13",
        "title": "Accreditation Claims"
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy claims accreditation, recognition or regulatory approval, that claim must be genuine."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may request supporting evidence where:"
      },
      {
        "type": "list",
        "items": [
          "a credible complaint is received;",
          "fraud is suspected;",
          "a regulatory concern arises;",
          "Students are being materially misled; or",
          "there are other reasonable grounds for review."
        ]
      },
      {
        "type": "section",
        "num": "14",
        "title": "Unregulated Training Providers"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy does not need to be formally accredited simply because it provides training through JIT Campus, unless applicable law requires such accreditation for the activities it conducts."
      },
      {
        "type": "paragraph",
        "text": "Independent training providers may use JIT Campus, provided they do not misrepresent the status of their Courses or certificates."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "COURSES AND PROGRAMMES"
      },
      {
        "type": "section",
        "num": "15",
        "title": "Creating Courses"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners may create Courses and Programmes using available JIT Campus tools."
      },
      {
        "type": "paragraph",
        "text": "Online Academies are responsible for determining:"
      },
      {
        "type": "list",
        "items": [
          "Course name;",
          "Course content;",
          "curriculum;",
          "duration;",
          "learning objectives;",
          "teaching format;",
          "admission requirements;",
          "assessments;",
          "fees;",
          "completion requirements; and",
          "certificate arrangements."
        ]
      },
      {
        "type": "section",
        "num": "16",
        "title": "Course Legitimacy"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not knowingly create Courses whose primary purpose is to facilitate:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "criminal activity;",
          "exploitation;",
          "serious academic misconduct;",
          "malicious hacking;",
          "unlawful discrimination;",
          "child exploitation; or",
          "another unlawful activity."
        ]
      },
      {
        "type": "section",
        "num": "17",
        "title": "Regulated Subjects"
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy provides education in an area that is subject to licensing, accreditation or regulatory requirements, the Online Academy Owner is responsible for understanding and complying with those requirements."
      },
      {
        "type": "paragraph",
        "text": "The availability of JIT Campus technology does not itself give the Online Academy regulatory approval."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "LECTURERS"
      },
      {
        "type": "section",
        "num": "18",
        "title": "Appointment of Lecturers"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners determine who may act as a Lecturer within their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "The Online Academy may decide what qualifications, experience or knowledge it expects from a Lecturer."
      },
      {
        "type": "section",
        "num": "19",
        "title": "Lecturer Verification"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not ordinarily verify every Lecturer appointed by every Online Academy."
      },
      {
        "type": "paragraph",
        "text": "If an Online Academy wishes to verify:"
      },
      {
        "type": "list",
        "items": [
          "qualifications;",
          "professional registration;",
          "references;",
          "identity;",
          "experience; or",
          "other credentials,"
        ]
      },
      {
        "type": "paragraph",
        "text": "the Online Academy is responsible for determining the appropriate process."
      },
      {
        "type": "section",
        "num": "20",
        "title": "Responsibility for Lecturers"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for managing Lecturer permissions within their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy becomes aware that a Lecturer is seriously violating Platform rules, it should take appropriate action."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "warning the Lecturer;",
          "restricting permissions;",
          "removing the Lecturer from a Course; or",
          "removing them from the Online Academy."
        ]
      },
      {
        "type": "paragraph",
        "text": "Serious Platform concerns may also be reported to JIT Campus."
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "ADMISSION MARKETERS"
      },
      {
        "type": "section",
        "num": "21",
        "title": "Appointment"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may appoint Admission Marketers where the functionality is available."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners determine:"
      },
      {
        "type": "list",
        "items": [
          "who may act as an Admission Marketer;",
          "what Courses they may promote;",
          "what Students they may access;",
          "what admissions functions they may perform; and",
          "what commission or remuneration arrangements apply."
        ]
      },
      {
        "type": "section",
        "num": "22",
        "title": "Responsibility for Admission Marketers"
      },
      {
        "type": "paragraph",
        "text": "Online Academies should take reasonable steps to ensure that their Admission Marketers do not:"
      },
      {
        "type": "list",
        "items": [
          "misrepresent Courses;",
          "guarantee admission improperly;",
          "collect unauthorised payments;",
          "make false accreditation claims;",
          "falsify applications;",
          "misuse Student information; or",
          "engage in other prohibited activity."
        ]
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "STUDENTS"
      },
      {
        "type": "section",
        "num": "23",
        "title": "Student Management"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners may manage Students enrolled in their Online Academy using available Platform tools."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "admissions;",
          "enrolment;",
          "Course allocation;",
          "academic records;",
          "assessments;",
          "communications;",
          "certificates; and",
          "Online Academy-level disciplinary action."
        ]
      },
      {
        "type": "section",
        "num": "24",
        "title": "Fair Treatment"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners should treat Students reasonably and must not use JIT Campus to facilitate:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "exploitation;",
          "harassment;",
          "unlawful discrimination;",
          "sexual misconduct;",
          "coercion; or",
          "other prohibited conduct."
        ]
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "ONLINE ACADEMY ADMINISTRATORS"
      },
      {
        "type": "section",
        "num": "25",
        "title": "Administrative Permissions"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus allows Online Academy Owners to appoint administrators, those Users may receive significant access to Online Academy information and functionality."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners should only grant administrative access to persons who genuinely require it."
      },
      {
        "type": "section",
        "num": "26",
        "title": "Responsibility for Permissions"
      },
      {
        "type": "paragraph",
        "text": "The Online Academy Owner is responsible for managing who has access to privileged Online Academy functions."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy Owner should remove or change permissions where:"
      },
      {
        "type": "list",
        "items": [
          "a User leaves the Online Academy;",
          "access is no longer required;",
          "an Account is compromised;",
          "a User changes responsibilities; or",
          "continued access creates a security risk."
        ]
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "DATA PROTECTION AND PRIVACY"
      },
      {
        "type": "section",
        "num": "27",
        "title": "Student Information"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners may receive access to personal information relating to Students."
      },
      {
        "type": "paragraph",
        "text": "Such information must not be used irresponsibly."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must not knowingly:"
      },
      {
        "type": "list",
        "items": [
          "sell Student information without lawful authority;",
          "publish private Student information unnecessarily;",
          "use Student information for fraud;",
          "share sensitive records with unauthorised persons; or",
          "use Student information for unrelated purposes without an appropriate basis."
        ]
      },
      {
        "type": "section",
        "num": "28",
        "title": "Access Control"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners should only provide Lecturers, Admission Marketers and administrators with access appropriate to their responsibilities."
      },
      {
        "type": "section",
        "num": "29",
        "title": "Downloads and Exports"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus enables Online Academy Owners to export Student information, the Online Academy Owner becomes responsible for protecting copies downloaded outside the JIT Campus environment."
      },
      {
        "type": "section",
        "num": "30",
        "title": "Independent Data Protection Responsibilities"
      },
      {
        "type": "paragraph",
        "text": "Depending on how an Online Academy operates and applicable law, the Online Academy itself may have separate responsibilities concerning personal information."
      },
      {
        "type": "paragraph",
        "text": "Nothing in the JIT Campus Privacy Policy removes an Online Academy’s own legal obligations."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "COMMUNICATIONS"
      },
      {
        "type": "section",
        "num": "31",
        "title": "Online Academy Communications"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may communicate with Students using available JIT Campus functionality."
      },
      {
        "type": "paragraph",
        "text": "Communications should be relevant, professional and not deliberately misleading."
      },
      {
        "type": "section",
        "num": "32",
        "title": "Promotional Communications"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may promote their Courses where permitted."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for ensuring that promotional activity complies with applicable Platform rules and legal requirements."
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not use JIT Campus to conduct deceptive or fraudulent marketing."
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "FEES"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Course Pricing"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may set prices for Courses and Programmes where permitted."
      },
      {
        "type": "paragraph",
        "text": "The Online Academy Owner is responsible for ensuring that pricing displayed to Students is accurate."
      },
      {
        "type": "section",
        "num": "34",
        "title": "Hidden Fees"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not deliberately advertise one price and then impose undisclosed mandatory charges after the Student has committed to purchase."
      },
      {
        "type": "paragraph",
        "text": "Important mandatory fees should be communicated before payment wherever reasonably practicable."
      },
      {
        "type": "section",
        "num": "35",
        "title": "Platform Fees"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may separately charge:"
      },
      {
        "type": "list",
        "items": [
          "subscription fees;",
          "transaction fees;",
          "service fees;",
          "premium feature fees; or",
          "other disclosed Platform charges."
        ]
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for reviewing applicable JIT Campus pricing before purchasing paid Platform Services."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "REFUNDS"
      },
      {
        "type": "section",
        "num": "36",
        "title": "Online Academy Refund Rules"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may establish their own refund and cancellation rules subject to:"
      },
      {
        "type": "list",
        "items": [
          "applicable law;",
          "JIT Campus minimum requirements; and",
          "the JIT Campus Fees, Payments, Refunds and Cancellation Policy."
        ]
      },
      {
        "type": "paragraph",
        "text": "Refund terms should not be deliberately misleading."
      },
      {
        "type": "section",
        "num": "37",
        "title": "Failure to Deliver"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy should not knowingly collect payment for Courses it has no intention or reasonable ability to deliver."
      },
      {
        "type": "paragraph",
        "text": "Repeated collection of fees without delivery may constitute serious misconduct or fraud."
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "CERTIFICATES"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Online Academy Certificates"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may issue certificates using available JIT Campus functionality."
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise, such certificates are issued by the Online Academy, not Jorsas Tech."
      },
      {
        "type": "section",
        "num": "39",
        "title": "Certificate Accuracy"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy must not knowingly issue a certificate:"
      },
      {
        "type": "list",
        "items": [
          "for a Course the Student never completed;",
          "containing materially false information;",
          "falsely presenting itself as government-issued;",
          "falsely claiming professional recognition; or",
          "falsely claiming accreditation."
        ]
      },
      {
        "type": "section",
        "num": "40",
        "title": "Certificate Verification"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus provides certificate verification, verification confirms that a certificate record exists within the Platform."
      },
      {
        "type": "paragraph",
        "text": "It does not automatically confirm accreditation of the Online Academy or qualification."
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "ONLINE ACADEMY BRANDING"
      },
      {
        "type": "section",
        "num": "41",
        "title": "Customisation"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may be permitted to customise their digital campus with:"
      },
      {
        "type": "list",
        "items": [
          "name;",
          "logo;",
          "colours;",
          "images;",
          "descriptions;",
          "Course catalogues; and",
          "other branding elements."
        ]
      },
      {
        "type": "section",
        "num": "42",
        "title": "Intellectual Property"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must have appropriate rights to logos, images, Course content and other material uploaded through their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may remove material where there is a credible intellectual-property complaint."
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "ONLINE ACADEMY CONTENT"
      },
      {
        "type": "section",
        "num": "43",
        "title": "Responsibility for Content"
      },
      {
        "type": "paragraph",
        "text": "Online Academies are responsible for educational and promotional content they upload."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not routinely pre-approve every:"
      },
      {
        "type": "list",
        "items": [
          "lesson;",
          "video;",
          "PDF;",
          "presentation;",
          "assessment;",
          "Course description; or",
          "Online Academy announcement."
        ]
      },
      {
        "type": "section",
        "num": "44",
        "title": "Prohibited Content"
      },
      {
        "type": "paragraph",
        "text": "Online Academies must not knowingly use JIT Campus to distribute content involving:"
      },
      {
        "type": "list",
        "items": [
          "child sexual abuse;",
          "serious unlawful exploitation;",
          "malware;",
          "fraud;",
          "illegal financial schemes;",
          "serious threats;",
          "unlawful intellectual-property infringement; or",
          "another activity prohibited under JIT Campus Terms."
        ]
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "ACADEMIC MANAGEMENT"
      },
      {
        "type": "section",
        "num": "45",
        "title": "Academic Decisions"
      },
      {
        "type": "paragraph",
        "text": "Online Academies remain responsible for their:"
      },
      {
        "type": "list",
        "items": [
          "assessments;",
          "marking;",
          "grades;",
          "pass requirements;",
          "progression;",
          "academic misconduct findings;",
          "resits;",
          "completion requirements; and",
          "certificates."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology used to administer these activities."
      },
      {
        "type": "section",
        "num": "46",
        "title": "Online Academy Academic Rules"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may create additional academic rules appropriate to their programmes."
      },
      {
        "type": "paragraph",
        "text": "Students should be informed of material academic rules that affect them."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "SAFEGUARDING"
      },
      {
        "type": "section",
        "num": "47",
        "title": "Online Academies Working With Children"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy that provides services to children or vulnerable persons is responsible for determining what additional safeguarding controls are legally or operationally required."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "parental consent;",
          "staff screening;",
          "designated safeguarding personnel;",
          "communication controls;",
          "background checks;",
          "staff training; and",
          "safeguarding procedures."
        ]
      },
      {
        "type": "section",
        "num": "48",
        "title": "JIT Campus Platform Safeguarding"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus retains the right to intervene where serious safeguarding concerns arise through the Platform."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "restricting Accounts;",
          "removing content;",
          "preserving relevant records;",
          "suspending an Online Academy; or",
          "referring serious matters to competent authorities where appropriate."
        ]
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "COMPLAINTS"
      },
      {
        "type": "section",
        "num": "49",
        "title": "Online Academy Complaint Handling"
      },
      {
        "type": "paragraph",
        "text": "Online Academies should provide a reasonable way for Students to raise concerns about:"
      },
      {
        "type": "list",
        "items": [
          "Courses;",
          "Lecturers;",
          "Admission Marketers;",
          "assessments;",
          "grades;",
          "Course delivery; and",
          "other Online Academy-controlled matters."
        ]
      },
      {
        "type": "section",
        "num": "50",
        "title": "Serious Complaints"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may intervene directly where a complaint involves:"
      },
      {
        "type": "list",
        "items": [
          "serious fraud;",
          "safeguarding;",
          "serious harassment;",
          "privacy violations;",
          "Platform security;",
          "systematic misrepresentation;",
          "false accreditation claims; or",
          "another serious breach of Platform rules."
        ]
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "ONLINE ACADEMY OWNER ACCOUNT SECURITY"
      },
      {
        "type": "section",
        "num": "51",
        "title": "Protecting Owner Accounts"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owner Accounts may have significant administrative privileges."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must take reasonable steps to protect their:"
      },
      {
        "type": "list",
        "items": [
          "password;",
          "login credentials;",
          "administrator access; and",
          "payment or payout settings."
        ]
      },
      {
        "type": "section",
        "num": "52",
        "title": "Account Sharing"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners should not share ownership credentials."
      },
      {
        "type": "paragraph",
        "text": "Where other Users need administrative access, they should be given separate authorised Accounts or roles where such functionality is available."
      },
      {
        "type": "section",
        "num": "53",
        "title": "Compromised Accounts"
      },
      {
        "type": "paragraph",
        "text": "Suspected Account compromise should be reported promptly."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may temporarily restrict Account activity while ownership or security concerns are investigated."
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "OWNERSHIP TRANSFERS"
      },
      {
        "type": "section",
        "num": "54",
        "title": "Transferring an Online Academy"
      },
      {
        "type": "paragraph",
        "text": "Where supported, an Online Academy Owner may request or authorise transfer of ownership to another eligible User."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may require reasonable confirmation before transferring Online Academy-level ownership permissions."
      },
      {
        "type": "section",
        "num": "55",
        "title": "Disputes Over Ownership"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is not automatically responsible for resolving internal company or partnership disputes concerning ownership of an Online Academy."
      },
      {
        "type": "paragraph",
        "text": "However, JIT Campus may temporarily restrict sensitive changes where there is a credible ownership dispute and a risk of unauthorised Account takeover."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "CLOSING AN ONLINE ACADEMY"
      },
      {
        "type": "section",
        "num": "56",
        "title": "Online Academy Closure"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy Owner may close or deactivate their Online Academy where Platform functionality permits."
      },
      {
        "type": "paragraph",
        "text": "Before closure, the Online Academy Owner should consider:"
      },
      {
        "type": "list",
        "items": [
          "enrolled Students;",
          "outstanding Courses;",
          "payments;",
          "refunds;",
          "Lecturer access;",
          "Student records;",
          "certificates; and",
          "applicable legal responsibilities."
        ]
      },
      {
        "type": "section",
        "num": "57",
        "title": "Student Impact"
      },
      {
        "type": "paragraph",
        "text": "Online Academies should not deliberately close immediately after receiving substantial Student payments merely to avoid providing purchased Courses or refunds."
      },
      {
        "type": "paragraph",
        "text": "Such conduct may be investigated as potential fraud."
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "JIT CAMPUS SUSPENSION OF AN ONLINE ACADEMY"
      },
      {
        "type": "section",
        "num": "58",
        "title": "Grounds for Restriction or Suspension"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may restrict or suspend an Online Academy where there is a reasonable basis to believe that the Online Academy is involved in:"
      },
      {
        "type": "list",
        "items": [
          "serious fraud;",
          "child exploitation;",
          "systematic harassment;",
          "deliberate false accreditation claims;",
          "significant intellectual-property abuse;",
          "serious privacy violations;",
          "malicious Platform activity;",
          "serious payment abuse;",
          "illegal activity; or",
          "repeated significant violations of JIT Campus policies."
        ]
      },
      {
        "type": "section",
        "num": "59",
        "title": "Temporary Restrictions"
      },
      {
        "type": "paragraph",
        "text": "Where urgent action is necessary, JIT Campus may temporarily restrict an Online Academy while concerns are investigated."
      },
      {
        "type": "paragraph",
        "text": "Temporary restriction does not necessarily constitute a final finding of wrongdoing."
      },
      {
        "type": "section",
        "num": "60",
        "title": "Termination"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may terminate an Online Academy’s access where serious or repeated violations are established or where continued operation creates an unacceptable legal, safety or Platform risk."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "ONLINE ACADEMY OWNER RESPONSIBILITY"
      },
      {
        "type": "section",
        "num": "61",
        "title": "Responsibility for the Online Academy"
      },
      {
        "type": "paragraph",
        "text": "The Online Academy Owner remains responsible for the Online Academy they operate."
      },
      {
        "type": "paragraph",
        "text": "This includes responsibility for:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy information;",
          "Courses;",
          "Users appointed to privileged roles;",
          "Course pricing;",
          "teaching arrangements;",
          "academic rules;",
          "Students;",
          "Online Academy-specific certificates;",
          "compliance obligations applying specifically to the Online Academy; and",
          "representations made by the Online Academy."
        ]
      },
      {
        "type": "section",
        "num": "62",
        "title": "JIT Campus as Technology Provider"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides tools enabling Online Academy Owners to operate their Online Academies."
      },
      {
        "type": "paragraph",
        "text": "Except where expressly stated otherwise, JIT Campus does not:"
      },
      {
        "type": "list",
        "items": [
          "own every Online Academy;",
          "employ every Lecturer;",
          "employ every Admission Marketer;",
          "approve every Course;",
          "verify every Online Academy;",
          "accredit every Online Academy;",
          "determine every Student’s grade;",
          "set every Online Academy’s curriculum; or",
          "guarantee every Online Academy’s educational outcomes."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVI",
        "title": "ONLINE ACADEMY OWNER INDEMNITY AND RESPONSIBILITY"
      },
      {
        "type": "section",
        "num": "63",
        "title": "Unauthorised Activity"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy Owner may be responsible for losses, complaints or claims arising from unlawful or unauthorised activities carried out through their Online Academy where responsibility properly rests with the Online Academy Owner."
      },
      {
        "type": "paragraph",
        "text": "This does not remove any responsibility that Jorsas Tech has under applicable law for matters within Jorsas Tech’s own control."
      },
      {
        "type": "part",
        "label": "PART XXVII",
        "title": "POLICY UPDATES"
      },
      {
        "type": "section",
        "num": "64",
        "title": "Changes to This Policy"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy where necessary because of:"
      },
      {
        "type": "list",
        "items": [
          "changes to Online Academy functionality;",
          "new administrative roles;",
          "changes to payment features;",
          "changes to Course functionality;",
          "emerging safety risks;",
          "changes to applicable law; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "paragraph",
        "text": "The latest version will be published through JIT Campus."
      },
      {
        "type": "section",
        "num": "65",
        "title": "Relationship With Other JIT Campus Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Admissions and Enrolment Policy;",
          "Fees, Payments, Refunds and Cancellation Policy;",
          "Academic Regulations and Assessment Policy;",
          "Academic Integrity Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct;",
          "Safeguarding, Equality and Anti-Harassment Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVIII",
        "title": "CONTACT"
      },
      {
        "type": "section",
        "num": "66",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners requiring assistance with the operation of their JIT Campus Online Academy may contact JIT Campus through the designated support channel."
      },
      {
        "type": "paragraph",
        "text": "Serious concerns involving fraud, safeguarding, privacy, payment abuse or Platform security should be reported through the appropriate JIT Campus channel."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Privacy: [Insert privacy email]"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding: [Insert safeguarding email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "acceptable-use",
    "title": "JIT CAMPUS ACCEPTABLE USE AND PROHIBITED ACTIVITIES POLICY",
    "shortTitle": "Acceptable Use",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, deliver Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "This Acceptable Use and Prohibited Activities Policy (“Policy”) establishes the minimum rules governing how JIT Campus may and may not be used."
      },
      {
        "type": "paragraph",
        "text": "This Policy applies to:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy Owners;",
          "Online Academies;",
          "Students;",
          "Lecturers;",
          "Admission Marketers;",
          "administrators;",
          "website visitors;",
          "other registered Users; and",
          "anyone accessing or interacting with JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "By using JIT Campus, Users agree not to use the Platform for unlawful, harmful, fraudulent, abusive or unauthorised purposes."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology and infrastructure. Users and Online Academies remain responsible for the activities they conduct through the Platform."
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "ACCEPTABLE USE"
      },
      {
        "type": "section",
        "num": "2",
        "title": "Permitted Use"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may be used for legitimate educational and related activities including:"
      },
      {
        "type": "list",
        "items": [
          "creating and managing Online Academies;",
          "delivering Courses;",
          "providing training;",
          "managing admissions;",
          "enrolling Students;",
          "teaching;",
          "communicating with Students;",
          "administering assessments;",
          "issuing Online Academy certificates;",
          "managing educational content;",
          "collecting legitimate Course fees;",
          "managing Lecturers;",
          "managing Admission Marketers;",
          "providing academic support;",
          "operating educational communities; and",
          "other legitimate purposes supported by JIT Campus."
        ]
      },
      {
        "type": "section",
        "num": "3",
        "title": "Lawful Use"
      },
      {
        "type": "paragraph",
        "text": "Users must use JIT Campus in accordance with applicable law."
      },
      {
        "type": "paragraph",
        "text": "A User must not use the Platform merely because a feature technically allows an activity where that activity is otherwise unlawful or prohibited."
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "FRAUD"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Fraudulent Use"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must not be used to commit or facilitate fraud."
      },
      {
        "type": "paragraph",
        "text": "Prohibited conduct includes:"
      },
      {
        "type": "list",
        "items": [
          "creating fake Online Academies for fraudulent purposes;",
          "collecting money for Courses that do not exist;",
          "creating fake Students;",
          "creating fraudulent enrolments;",
          "falsifying transactions;",
          "using stolen payment information;",
          "producing fraudulent payment evidence;",
          "creating fake qualifications;",
          "manipulating academic records;",
          "impersonating another person; or",
          "deliberately deceiving Users for financial gain."
        ]
      },
      {
        "type": "section",
        "num": "5",
        "title": "False Educational Claims"
      },
      {
        "type": "paragraph",
        "text": "Users must not knowingly make materially false claims concerning:"
      },
      {
        "type": "list",
        "items": [
          "accreditation;",
          "government recognition;",
          "professional recognition;",
          "university status;",
          "qualifications;",
          "Lecturer credentials;",
          "guaranteed employment;",
          "guaranteed income;",
          "guaranteed immigration outcomes;",
          "professional licensing; or",
          "another significant educational outcome."
        ]
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "IMPERSONATION"
      },
      {
        "type": "section",
        "num": "6",
        "title": "Impersonating Individuals"
      },
      {
        "type": "paragraph",
        "text": "Users must not create Accounts or profiles designed to deliberately impersonate another person without authority."
      },
      {
        "type": "paragraph",
        "text": "This includes impersonating:"
      },
      {
        "type": "list",
        "items": [
          "Students;",
          "Lecturers;",
          "Admission Marketers;",
          "Online Academy Owners;",
          "public figures;",
          "employees;",
          "professionals; or",
          "other individuals."
        ]
      },
      {
        "type": "section",
        "num": "7",
        "title": "Impersonating Organisations"
      },
      {
        "type": "paragraph",
        "text": "Users must not falsely create or operate an Online Academy claiming to represent:"
      },
      {
        "type": "list",
        "items": [
          "a university;",
          "college;",
          "company;",
          "government agency;",
          "professional body;",
          "charity;",
          "training institution; or",
          "another organisation"
        ]
      },
      {
        "type": "paragraph",
        "text": "without appropriate authority."
      },
      {
        "type": "section",
        "num": "8",
        "title": "Impersonating JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Users must not falsely claim to be:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus employees;",
          "Jorsas Tech employees;",
          "official JIT Campus representatives;",
          "JIT Campus regulators;",
          "JIT Campus accreditation officers; or",
          "authorised spokespersons"
        ]
      },
      {
        "type": "paragraph",
        "text": "unless expressly authorised."
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "ILLEGAL ACTIVITIES"
      },
      {
        "type": "section",
        "num": "9",
        "title": "Criminal Activity"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to facilitate or promote serious unlawful activities."
      },
      {
        "type": "paragraph",
        "text": "This includes using the Platform to:"
      },
      {
        "type": "list",
        "items": [
          "commit fraud;",
          "facilitate theft;",
          "coordinate criminal activity;",
          "distribute illegal materials;",
          "exploit children;",
          "facilitate trafficking;",
          "launder criminal proceeds;",
          "distribute malicious software;",
          "facilitate extortion;",
          "organise violent crime; or",
          "conduct another unlawful activity."
        ]
      },
      {
        "type": "section",
        "num": "10",
        "title": "Educational Content About Sensitive Subjects"
      },
      {
        "type": "paragraph",
        "text": "Teaching about crime, cybersecurity, law enforcement, safety, history or other sensitive topics is not automatically prohibited."
      },
      {
        "type": "paragraph",
        "text": "The relevant distinction is between legitimate education and content intended to facilitate harmful or unlawful conduct."
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "CHILD EXPLOITATION"
      },
      {
        "type": "section",
        "num": "11",
        "title": "Absolute Prohibition"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must not be used for child sexual exploitation or abuse."
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "groom children;",
          "solicit sexual activity from children;",
          "request sexual images from children;",
          "distribute child sexual abuse material;",
          "facilitate sexual exploitation;",
          "arrange abusive contact;",
          "blackmail children using sexual content; or",
          "knowingly facilitate other forms of child exploitation."
        ]
      },
      {
        "type": "paragraph",
        "text": "Serious cases may result in immediate restriction or termination."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "HARASSMENT AND THREATS"
      },
      {
        "type": "section",
        "num": "12",
        "title": "Harassment"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to engage in serious or repeated harassment."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "abusive messaging;",
          "stalking;",
          "targeted intimidation;",
          "sexual harassment;",
          "discriminatory abuse;",
          "persistent unwanted contact;",
          "coordinated harassment; or",
          "malicious humiliation."
        ]
      },
      {
        "type": "section",
        "num": "13",
        "title": "Threats"
      },
      {
        "type": "paragraph",
        "text": "Users must not make credible threats of serious violence against another person."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may take immediate action where a credible safety threat exists."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "HATEFUL OR DISCRIMINATORY ABUSE"
      },
      {
        "type": "section",
        "num": "14",
        "title": "Discriminatory Conduct"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must not be used to unlawfully discriminate against or seriously abuse individuals based on protected characteristics."
      },
      {
        "type": "paragraph",
        "text": "This does not prevent:"
      },
      {
        "type": "list",
        "items": [
          "academic discussion;",
          "religious study;",
          "political discussion;",
          "historical analysis;",
          "legal education; or",
          "good-faith debate"
        ]
      },
      {
        "type": "paragraph",
        "text": "where such activity otherwise complies with JIT Campus rules."
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "SEXUAL MISCONDUCT"
      },
      {
        "type": "section",
        "num": "15",
        "title": "Sexual Exploitation"
      },
      {
        "type": "paragraph",
        "text": "Users must not use educational authority to pressure another User into sexual activity."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners, Lecturers and Admission Marketers must not condition:"
      },
      {
        "type": "list",
        "items": [
          "admission;",
          "grades;",
          "certificates;",
          "Course access;",
          "recommendations;",
          "employment opportunities; or",
          "other educational benefits"
        ]
      },
      {
        "type": "paragraph",
        "text": "on sexual activity."
      },
      {
        "type": "section",
        "num": "16",
        "title": "Unsolicited Sexual Content"
      },
      {
        "type": "paragraph",
        "text": "Users must not send unsolicited sexually explicit material through JIT Campus communication channels."
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "SECURITY AND CYBER MISUSE"
      },
      {
        "type": "section",
        "num": "17",
        "title": "Unauthorised Access"
      },
      {
        "type": "paragraph",
        "text": "Users must not attempt to gain unauthorised access to:"
      },
      {
        "type": "list",
        "items": [
          "another Account;",
          "another Online Academy;",
          "administrative functionality;",
          "Student records;",
          "payment systems;",
          "databases;",
          "source code;",
          "infrastructure; or",
          "restricted Platform areas."
        ]
      },
      {
        "type": "section",
        "num": "18",
        "title": "Malicious Software"
      },
      {
        "type": "paragraph",
        "text": "Users must not knowingly upload or distribute:"
      },
      {
        "type": "list",
        "items": [
          "viruses;",
          "ransomware;",
          "spyware;",
          "malicious scripts;",
          "credential-stealing software; or",
          "other harmful code."
        ]
      },
      {
        "type": "section",
        "num": "19",
        "title": "Technical Interference"
      },
      {
        "type": "paragraph",
        "text": "Users must not deliberately:"
      },
      {
        "type": "list",
        "items": [
          "overload the Platform;",
          "conduct denial-of-service attacks;",
          "disrupt services;",
          "bypass technical restrictions;",
          "interfere with security controls;",
          "manipulate logs;",
          "manipulate timestamps;",
          "exploit vulnerabilities for improper purposes; or",
          "interfere with other Users’ access."
        ]
      },
      {
        "type": "section",
        "num": "20",
        "title": "Security Research"
      },
      {
        "type": "paragraph",
        "text": "Good-faith identification of a potential security weakness is not automatically prohibited."
      },
      {
        "type": "paragraph",
        "text": "Users who discover vulnerabilities should report them through the appropriate JIT Campus security or support channel rather than exploiting them."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "ACADEMIC SYSTEM ABUSE"
      },
      {
        "type": "section",
        "num": "21",
        "title": "Manipulation of Academic Records"
      },
      {
        "type": "paragraph",
        "text": "Users must not improperly alter:"
      },
      {
        "type": "list",
        "items": [
          "marks;",
          "grades;",
          "assessment records;",
          "submission timestamps;",
          "Student completion records;",
          "attendance;",
          "certificates; or",
          "other academic records."
        ]
      },
      {
        "type": "section",
        "num": "22",
        "title": "Assessment Manipulation"
      },
      {
        "type": "paragraph",
        "text": "Users must not use Platform vulnerabilities or unauthorised tools to:"
      },
      {
        "type": "list",
        "items": [
          "bypass examination restrictions;",
          "gain access to unreleased questions;",
          "alter assessment results;",
          "impersonate Students;",
          "create fraudulent submissions; or",
          "circumvent Course completion requirements."
        ]
      },
      {
        "type": "paragraph",
        "text": "Academic conduct is further governed by the Academic Integrity Policy."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "PAYMENT SYSTEM ABUSE"
      },
      {
        "type": "section",
        "num": "23",
        "title": "Payment Fraud"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus for:"
      },
      {
        "type": "list",
        "items": [
          "stolen-card transactions;",
          "fraudulent chargebacks;",
          "fake payments;",
          "false refunds;",
          "transaction manipulation;",
          "commission fraud;",
          "fake enrolments intended to generate payments; or",
          "other payment abuse."
        ]
      },
      {
        "type": "section",
        "num": "24",
        "title": "Payment Processing for Unrelated Activity"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus payment features must not be used as a general payment-processing service for transactions unrelated to legitimate Platform activities unless JIT Campus expressly permits such use."
      },
      {
        "type": "section",
        "num": "25",
        "title": "Money Laundering and Financial Crime"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to conceal, move or process criminal proceeds."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may restrict transactions or Accounts where serious financial misuse is reasonably suspected."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "SPAM AND UNSOLICITED COMMUNICATION"
      },
      {
        "type": "section",
        "num": "26",
        "title": "Spam"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to send excessive, deceptive or malicious unsolicited communications."
      },
      {
        "type": "section",
        "num": "27",
        "title": "Admission Marketer Communications"
      },
      {
        "type": "paragraph",
        "text": "Admission Marketers may legitimately contact prospective Students where authorised."
      },
      {
        "type": "paragraph",
        "text": "However, they must not:"
      },
      {
        "type": "list",
        "items": [
          "repeatedly contact Users who have clearly asked them to stop where applicable;",
          "use deceptive identities;",
          "send malicious links;",
          "conduct fraudulent marketing; or",
          "misrepresent the Online Academy they represent."
        ]
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "INTELLECTUAL PROPERTY"
      },
      {
        "type": "section",
        "num": "28",
        "title": "Copyright and Other Rights"
      },
      {
        "type": "paragraph",
        "text": "Users must not knowingly upload or distribute material that unlawfully infringes another person’s intellectual property rights."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "pirated Courses;",
          "illegally copied books;",
          "copyrighted videos;",
          "stolen course materials;",
          "unlicensed software; or",
          "another person’s proprietary content."
        ]
      },
      {
        "type": "section",
        "num": "29",
        "title": "Ownership Claims"
      },
      {
        "type": "paragraph",
        "text": "Users must not falsely claim ownership of another person’s work."
      },
      {
        "type": "section",
        "num": "30",
        "title": "Intellectual Property Complaints"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may remove or restrict content where a credible intellectual-property complaint is received and appropriate action is reasonably necessary."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "MISLEADING ONLINE ACADEMY CONTENT"
      },
      {
        "type": "section",
        "num": "31",
        "title": "Fake Online Academy Information"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners must not knowingly create misleading:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy descriptions;",
          "Lecturer profiles;",
          "Student testimonials;",
          "rankings;",
          "accreditations;",
          "partnerships;",
          "certifications;",
          "Course outcomes; or",
          "claims about employment success."
        ]
      },
      {
        "type": "section",
        "num": "32",
        "title": "Fake Testimonials and Reviews"
      },
      {
        "type": "paragraph",
        "text": "Users must not knowingly create fake Student testimonials or manipulate reviews in a materially deceptive way."
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "DECEPTIVE SALES PRACTICES"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Misleading Advertising"
      },
      {
        "type": "paragraph",
        "text": "Online Academies and Admission Marketers must not use JIT Campus to advertise Courses using materially false or deceptive claims."
      },
      {
        "type": "section",
        "num": "34",
        "title": "False Scarcity"
      },
      {
        "type": "paragraph",
        "text": "Users must not knowingly create false urgency by claiming, for example:"
      },
      {
        "type": "list",
        "items": [
          "“only one place remains”;",
          "“offer ends today”;",
          "“government approval expires tonight”; or",
          "another time-sensitive claim"
        ]
      },
      {
        "type": "paragraph",
        "text": "where they know that claim is false and it is being used to improperly pressure Students."
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "MULTI-LEVEL OR PYRAMID ACTIVITY"
      },
      {
        "type": "section",
        "num": "35",
        "title": "Pyramid Schemes"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must not be used primarily to operate illegal pyramid or similar fraudulent recruitment schemes disguised as education."
      },
      {
        "type": "paragraph",
        "text": "Legitimate referral or Admission Marketer commission arrangements are not automatically prohibited merely because commissions are paid."
      },
      {
        "type": "paragraph",
        "text": "The underlying activity must remain legitimate."
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "HEALTH, LEGAL AND OTHER PROFESSIONAL EDUCATION"
      },
      {
        "type": "section",
        "num": "36",
        "title": "Professional Subjects"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may provide Courses relating to professional or regulated areas where lawful."
      },
      {
        "type": "paragraph",
        "text": "However, Online Academies must not falsely represent educational content as professional licensing or regulated advice where that claim is inaccurate."
      },
      {
        "type": "section",
        "num": "37",
        "title": "No Automatic Professional Qualification"
      },
      {
        "type": "paragraph",
        "text": "Completion of a Course hosted on JIT Campus does not automatically make a Student:"
      },
      {
        "type": "list",
        "items": [
          "a doctor;",
          "nurse;",
          "lawyer;",
          "accountant;",
          "engineer;",
          "counsellor;",
          "financial adviser; or",
          "another regulated professional."
        ]
      },
      {
        "type": "paragraph",
        "text": "Online Academies are responsible for accurately describing the status of their Courses."
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "DANGEROUS CONTENT"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Serious Harm"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must not be used primarily to instruct Users in committing serious harm or unlawful acts."
      },
      {
        "type": "paragraph",
        "text": "Legitimate academic, scientific, historical, professional or safety education involving potentially dangerous topics may be permitted where appropriate."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "MISUSE OF PERSONAL DATA"
      },
      {
        "type": "section",
        "num": "39",
        "title": "Unauthorised Data Use"
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "sell Student data without lawful authority;",
          "scrape personal information for unauthorised purposes;",
          "publish confidential records;",
          "use private information for extortion;",
          "access records outside their permissions; or",
          "misuse personal information obtained through JIT Campus."
        ]
      },
      {
        "type": "section",
        "num": "40",
        "title": "Online Academy Data Access"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners, Lecturers and Admission Marketers may have greater access to Student information because of their roles."
      },
      {
        "type": "paragraph",
        "text": "That access must not be used for unrelated or improper purposes."
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "AUTOMATED ACCESS AND SCRAPING"
      },
      {
        "type": "section",
        "num": "41",
        "title": "Bots and Automation"
      },
      {
        "type": "paragraph",
        "text": "Users must not use automated tools to:"
      },
      {
        "type": "list",
        "items": [
          "overload JIT Campus;",
          "scrape large quantities of protected information;",
          "create fake Accounts at scale;",
          "manipulate Course activity;",
          "generate fake enrolments;",
          "manipulate rankings;",
          "circumvent Platform controls; or",
          "conduct other abusive activity."
        ]
      },
      {
        "type": "paragraph",
        "text": "Authorised integrations or automation provided or approved by JIT Campus are permitted."
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "ACCOUNT ABUSE"
      },
      {
        "type": "section",
        "num": "42",
        "title": "Multiple Accounts"
      },
      {
        "type": "paragraph",
        "text": "Users must not create multiple Accounts primarily to:"
      },
      {
        "type": "list",
        "items": [
          "circumvent suspension;",
          "conduct fraud;",
          "obtain repeated introductory benefits improperly;",
          "manipulate Online Academy statistics;",
          "generate false activity; or",
          "evade enforcement."
        ]
      },
      {
        "type": "section",
        "num": "43",
        "title": "Account Selling"
      },
      {
        "type": "paragraph",
        "text": "Users must not sell or transfer JIT Campus Accounts without authorisation."
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "PLATFORM IDENTITY AND BRANDING"
      },
      {
        "type": "section",
        "num": "44",
        "title": "JIT Campus Brand"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus branding in a way that falsely suggests:"
      },
      {
        "type": "list",
        "items": [
          "ownership;",
          "official endorsement;",
          "accreditation;",
          "employment;",
          "partnership; or",
          "regulatory approval."
        ]
      },
      {
        "type": "section",
        "num": "45",
        "title": "Online Academy Branding"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may use their own branding where they have appropriate rights to do so."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "REPORTING PROHIBITED ACTIVITY"
      },
      {
        "type": "section",
        "num": "46",
        "title": "Reporting"
      },
      {
        "type": "paragraph",
        "text": "Users may report suspected prohibited activity through the appropriate Online Academy or JIT Campus reporting channel."
      },
      {
        "type": "paragraph",
        "text": "Serious concerns involving:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "safeguarding;",
          "child exploitation;",
          "security;",
          "major privacy violations;",
          "threats; or",
          "systematic Platform abuse"
        ]
      },
      {
        "type": "paragraph",
        "text": "may be reported directly to JIT Campus."
      },
      {
        "type": "section",
        "num": "47",
        "title": "Good-Faith Reports"
      },
      {
        "type": "paragraph",
        "text": "Users should not be penalised merely because they report a genuine concern that is later found to be unsubstantiated."
      },
      {
        "type": "paragraph",
        "text": "Knowingly fabricated malicious reports may themselves violate JIT Campus rules."
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "INVESTIGATIONS"
      },
      {
        "type": "section",
        "num": "48",
        "title": "Review of Activity"
      },
      {
        "type": "paragraph",
        "text": "Where misuse is reasonably suspected, JIT Campus may review relevant information including:"
      },
      {
        "type": "list",
        "items": [
          "Account activity;",
          "Online Academy information;",
          "communications;",
          "transaction records;",
          "access logs;",
          "uploaded content;",
          "academic activity; and",
          "other relevant Platform information."
        ]
      },
      {
        "type": "section",
        "num": "49",
        "title": "Request for Information"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may request additional information where reasonably necessary to investigate suspected misuse."
      },
      {
        "type": "paragraph",
        "text": "This does not mean that JIT Campus routinely verifies every User or Online Academy."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "ENFORCEMENT"
      },
      {
        "type": "section",
        "num": "50",
        "title": "Available Actions"
      },
      {
        "type": "paragraph",
        "text": "Where this Policy is violated, JIT Campus may:"
      },
      {
        "type": "list",
        "items": [
          "provide guidance;",
          "issue a warning;",
          "remove content;",
          "restrict particular functionality;",
          "restrict payments or payouts;",
          "restrict communication;",
          "temporarily suspend an Account;",
          "suspend an Online Academy; or",
          "terminate access."
        ]
      },
      {
        "type": "section",
        "num": "51",
        "title": "Proportionate Enforcement"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should generally consider:"
      },
      {
        "type": "list",
        "items": [
          "seriousness of the conduct;",
          "risk to Users;",
          "whether the conduct appears intentional;",
          "previous violations;",
          "potential harm;",
          "whether immediate protection is required; and",
          "other relevant circumstances."
        ]
      },
      {
        "type": "section",
        "num": "52",
        "title": "Immediate Action"
      },
      {
        "type": "paragraph",
        "text": "Immediate restrictions may be imposed where necessary to address serious concerns involving:"
      },
      {
        "type": "list",
        "items": [
          "child exploitation;",
          "active fraud;",
          "credible threats;",
          "major security attacks;",
          "Account compromise;",
          "serious harassment;",
          "illegal content; or",
          "another urgent risk."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVI",
        "title": "EXTERNAL REPORTING"
      },
      {
        "type": "section",
        "num": "53",
        "title": "Authorities"
      },
      {
        "type": "paragraph",
        "text": "Jorsas Tech may report activity to competent authorities where required or permitted by law."
      },
      {
        "type": "paragraph",
        "text": "This may include matters involving:"
      },
      {
        "type": "list",
        "items": [
          "criminal conduct;",
          "child protection;",
          "serious fraud;",
          "cybersecurity;",
          "threats to safety; or",
          "other serious unlawful activity."
        ]
      },
      {
        "type": "part",
        "label": "PART XXVII",
        "title": "NO GENERAL MONITORING OBLIGATION"
      },
      {
        "type": "section",
        "num": "54",
        "title": "User-Generated Activity"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may host substantial amounts of User and Online Academy-generated content."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not necessarily review or pre-approve every:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy;",
          "Course;",
          "message;",
          "assignment;",
          "video;",
          "document;",
          "Lecturer;",
          "Student; or",
          "Admission Marketer before Platform use."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may nevertheless take action when prohibited activity is identified or credibly reported."
      },
      {
        "type": "part",
        "label": "PART XXVIII",
        "title": "ONLINE ACADEMY RESPONSIBILITY"
      },
      {
        "type": "section",
        "num": "55",
        "title": "Managing Online Academy Activity"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for managing Users and activities within their Online Academies."
      },
      {
        "type": "paragraph",
        "text": "Online Academies should take reasonable action where they become aware that Users they appointed are seriously violating applicable rules."
      },
      {
        "type": "section",
        "num": "56",
        "title": "Platform-Wide Rules"
      },
      {
        "type": "paragraph",
        "text": "An Online Academy cannot authorise conduct prohibited by mandatory JIT Campus rules."
      },
      {
        "type": "paragraph",
        "text": "For example, an Online Academy cannot give permission for:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "child exploitation;",
          "serious harassment;",
          "malicious hacking; or",
          "unlawful use of personal information."
        ]
      },
      {
        "type": "part",
        "label": "PART XXIX",
        "title": "CHANGES TO THIS POLICY"
      },
      {
        "type": "section",
        "num": "57",
        "title": "Policy Updates"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "emerging misuse patterns;",
          "new Platform functionality;",
          "changes to cybersecurity risks;",
          "changes in applicable law;",
          "new payment features;",
          "new communication tools; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "paragraph",
        "text": "The latest version will be published through JIT Campus."
      },
      {
        "type": "section",
        "num": "58",
        "title": "Relationship With Other Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Online Academy Owner and Online Academy Management Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct;",
          "Academic Integrity Policy;",
          "Safeguarding, Equality and Anti-Harassment Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where another policy contains more specific requirements for a particular type of conduct, that policy should be read alongside this one."
      },
      {
        "type": "part",
        "label": "PART XXX",
        "title": "CONTACT"
      },
      {
        "type": "section",
        "num": "59",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "Questions about acceptable use of JIT Campus may be submitted through the official JIT Campus support channel."
      },
      {
        "type": "paragraph",
        "text": "Serious concerns involving fraud, safeguarding, security or unlawful activity may be reported through the relevant designated channel."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Security: [Insert security email]"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding: [Insert safeguarding email]"
      },
      {
        "type": "paragraph",
        "text": "Privacy: [Insert privacy email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "safeguarding-equality",
    "title": "JIT CAMPUS SAFEGUARDING, EQUALITY AND ANTI-HARASSMENT POLICY",
    "shortTitle": "Safeguarding & Equality",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, developed to provide a digital Software-as-a-Service (SaaS) platform through which individuals and organisations can create and operate Online Academies, deliver Courses and Programmes, appoint Lecturers and Admission Marketers, enrol Students and administer educational activities."
      },
      {
        "type": "paragraph",
        "text": "Jorsas Tech is committed to providing a digital environment in which Users can participate in educational activities without being subjected to abuse, exploitation, unlawful discrimination, bullying or harassment."
      },
      {
        "type": "paragraph",
        "text": "This Safeguarding, Equality and Anti-Harassment Policy (“Policy”) establishes minimum safety and conduct requirements applicable across JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides the technology and infrastructure. Individual Online Academies remain responsible for managing their own educational communities and for meeting any safeguarding, equality, employment, educational or regulatory obligations that apply specifically to their activities."
      },
      {
        "type": "paragraph",
        "text": "However, JIT Campus may intervene directly where conduct creates a serious risk to Users, violates Platform rules, threatens Platform safety or may involve unlawful activity."
      },
      {
        "type": "paragraph",
        "text": "This Policy applies to:"
      },
      {
        "type": "list",
        "items": [
          "Online Academy Owners;",
          "Online Academies;",
          "Students;",
          "Lecturers;",
          "Admission Marketers;",
          "administrators;",
          "other authorised Users; and",
          "interactions occurring through JIT Campus."
        ]
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "SAFEGUARDING PRINCIPLES"
      },
      {
        "type": "section",
        "num": "2",
        "title": "What Safeguarding Means"
      },
      {
        "type": "paragraph",
        "text": "For the purposes of JIT Campus, safeguarding means taking reasonable steps to protect Users, particularly children and vulnerable persons, from serious harm, abuse, exploitation and inappropriate conduct occurring through use of the Platform."
      },
      {
        "type": "paragraph",
        "text": "Safeguarding concerns may include:"
      },
      {
        "type": "list",
        "items": [
          "physical abuse;",
          "emotional abuse;",
          "sexual abuse;",
          "sexual exploitation;",
          "grooming;",
          "financial exploitation;",
          "coercion;",
          "threats;",
          "serious bullying;",
          "online exploitation;",
          "trafficking-related conduct;",
          "child sexual abuse material;",
          "and other conduct creating a serious risk of harm."
        ]
      },
      {
        "type": "section",
        "num": "3",
        "title": "Shared Responsibility"
      },
      {
        "type": "paragraph",
        "text": "Safety on JIT Campus is a shared responsibility."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus establishes minimum Platform rules."
      },
      {
        "type": "paragraph",
        "text": "Online Academies are responsible for managing their own educational environments."
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for Users they appoint to privileged roles."
      },
      {
        "type": "paragraph",
        "text": "Lecturers and Admission Marketers must maintain appropriate professional boundaries."
      },
      {
        "type": "paragraph",
        "text": "Students must comply with applicable conduct requirements."
      },
      {
        "type": "paragraph",
        "text": "Users should report serious safety concerns where appropriate."
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "CHILDREN AND YOUNGER USERS"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Children Using JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Some Online Academies using JIT Campus may provide educational services to children or younger Students."
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy chooses to provide services to children, that Online Academy is responsible for understanding and complying with safeguarding requirements applicable to its activities."
      },
      {
        "type": "paragraph",
        "text": "This may include requirements relating to:"
      },
      {
        "type": "list",
        "items": [
          "parental or guardian consent;",
          "appropriate communication;",
          "staff suitability;",
          "background checks where required;",
          "supervision;",
          "recording;",
          "data protection;",
          "child protection procedures; and",
          "mandatory reporting."
        ]
      },
      {
        "type": "section",
        "num": "5",
        "title": "JIT Campus Does Not Replace Online Academy Safeguarding Procedures"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus provides Platform-level safeguards but does not replace safeguarding systems that an Online Academy may be legally or professionally required to maintain."
      },
      {
        "type": "paragraph",
        "text": "An Online Academy working with children should determine whether it requires:"
      },
      {
        "type": "list",
        "items": [
          "safeguarding officers;",
          "background checks;",
          "parental consent;",
          "child-protection training;",
          "additional communication restrictions;",
          "supervision requirements; or",
          "other safeguards."
        ]
      },
      {
        "type": "section",
        "num": "6",
        "title": "No Automatic Background Checks"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus does not ordinarily conduct criminal-record checks, background checks, professional checks or identification-document verification on every Online Academy Owner, Lecturer, Admission Marketer or other User."
      },
      {
        "type": "paragraph",
        "text": "Online Academies remain responsible for deciding what checks are appropriate or legally required before giving a person responsibility for children or vulnerable Students."
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "CHILD SEXUAL EXPLOITATION AND ABUSE"
      },
      {
        "type": "section",
        "num": "7",
        "title": "Zero Tolerance"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus must never be used to facilitate child sexual exploitation or abuse."
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to:"
      },
      {
        "type": "list",
        "items": [
          "groom a child;",
          "solicit sexual activity from a child;",
          "request sexual images from a child;",
          "distribute child sexual abuse material;",
          "sexualise interactions with children;",
          "arrange exploitation;",
          "facilitate trafficking;",
          "blackmail a child using sexual content; or",
          "otherwise sexually exploit a child."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such conduct may result in immediate Account restriction or termination."
      },
      {
        "type": "section",
        "num": "8",
        "title": "Sexual Images of Children"
      },
      {
        "type": "paragraph",
        "text": "Users must not upload, request, share, store, transmit or distribute child sexual abuse material through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus becomes aware of suspected illegal material, Jorsas Tech may preserve relevant information and make reports to appropriate authorities where required or permitted by law."
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "GROOMING"
      },
      {
        "type": "section",
        "num": "9",
        "title": "Grooming Behaviour"
      },
      {
        "type": "paragraph",
        "text": "Grooming may involve developing a relationship of trust with a child or vulnerable person for the purpose of exploitation or abuse."
      },
      {
        "type": "paragraph",
        "text": "Prohibited conduct may include:"
      },
      {
        "type": "list",
        "items": [
          "sexualised private communication;",
          "requesting secrecy from a child;",
          "attempting to isolate a child from parents or guardians;",
          "requesting inappropriate photographs;",
          "offering gifts in exchange for sexual behaviour;",
          "manipulating a child into private meetings;",
          "threatening a child into silence; or",
          "gradually introducing sexual content into communications."
        ]
      },
      {
        "type": "section",
        "num": "10",
        "title": "Professional Boundaries With Children"
      },
      {
        "type": "paragraph",
        "text": "Lecturers, Admission Marketers and Online Academy personnel interacting with children should maintain appropriate professional boundaries."
      },
      {
        "type": "paragraph",
        "text": "Where possible, communications concerning educational matters should take place through approved Online Academy or JIT Campus channels."
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "VULNERABLE PERSONS"
      },
      {
        "type": "section",
        "num": "11",
        "title": "Protection From Exploitation"
      },
      {
        "type": "paragraph",
        "text": "Users must not deliberately exploit another User because of vulnerability."
      },
      {
        "type": "paragraph",
        "text": "This may include exploitation based on:"
      },
      {
        "type": "list",
        "items": [
          "age;",
          "disability;",
          "financial hardship;",
          "dependency;",
          "lack of education;",
          "emotional vulnerability; or",
          "another circumstance that significantly reduces the person’s ability to protect their interests."
        ]
      },
      {
        "type": "section",
        "num": "12",
        "title": "Financial Exploitation"
      },
      {
        "type": "paragraph",
        "text": "Lecturers, Admission Marketers and Online Academy Owners must not use their position to improperly pressure vulnerable Students into:"
      },
      {
        "type": "list",
        "items": [
          "making unauthorised payments;",
          "transferring personal funds;",
          "purchasing unrelated products;",
          "giving gifts;",
          "providing financial information; or",
          "participating in fraudulent schemes."
        ]
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "EQUALITY"
      },
      {
        "type": "section",
        "num": "13",
        "title": "Equal Treatment"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus aims to provide a Platform on which Users can participate without unlawful discrimination."
      },
      {
        "type": "paragraph",
        "text": "Online Academies and Users should comply with applicable equality and anti-discrimination requirements."
      },
      {
        "type": "section",
        "num": "14",
        "title": "Protected Characteristics"
      },
      {
        "type": "paragraph",
        "text": "Depending on applicable law, discrimination protections may relate to characteristics including:"
      },
      {
        "type": "list",
        "items": [
          "age;",
          "disability;",
          "sex;",
          "race;",
          "ethnicity;",
          "nationality;",
          "religion or belief;",
          "pregnancy or maternity;",
          "marriage or civil partnership;",
          "sexual orientation;",
          "gender reassignment; and",
          "other characteristics protected by applicable law."
        ]
      },
      {
        "type": "paragraph",
        "text": "The precise legal categories may differ between jurisdictions."
      },
      {
        "type": "section",
        "num": "15",
        "title": "Academic Requirements Are Not Automatically Discrimination"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may establish legitimate academic or professional requirements."
      },
      {
        "type": "paragraph",
        "text": "For example, requiring:"
      },
      {
        "type": "list",
        "items": [
          "prerequisite knowledge;",
          "particular Course completion;",
          "professional competence;",
          "attendance;",
          "assessment standards; or",
          "language proficiency"
        ]
      },
      {
        "type": "paragraph",
        "text": "does not automatically constitute discrimination where the requirement is legitimate and lawfully applied."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "ACCESSIBILITY"
      },
      {
        "type": "section",
        "num": "16",
        "title": "Accessibility"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus aims to improve accessibility of its digital Platform over time."
      },
      {
        "type": "paragraph",
        "text": "Online Academies should also consider reasonable accessibility needs when delivering educational activities."
      },
      {
        "type": "section",
        "num": "17",
        "title": "Reasonable Adjustments"
      },
      {
        "type": "paragraph",
        "text": "Where applicable, Online Academies should consider reasonable requests from Students requiring adjustments to participate in learning activities."
      },
      {
        "type": "paragraph",
        "text": "Depending on circumstances, adjustments may include:"
      },
      {
        "type": "list",
        "items": [
          "additional assessment time;",
          "accessible materials;",
          "alternative formats;",
          "captioning;",
          "adjusted participation arrangements; or",
          "other reasonable measures."
        ]
      },
      {
        "type": "paragraph",
        "text": "The relevant Online Academy remains responsible for determining Course-specific adjustments."
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "HARASSMENT"
      },
      {
        "type": "section",
        "num": "18",
        "title": "Prohibition of Harassment"
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to harass another person."
      },
      {
        "type": "paragraph",
        "text": "Harassment may include serious or repeated unwanted conduct that violates another person’s dignity or creates an intimidating, hostile, degrading, humiliating or offensive environment."
      },
      {
        "type": "section",
        "num": "19",
        "title": "Examples of Harassment"
      },
      {
        "type": "paragraph",
        "text": "Depending on the circumstances, prohibited harassment may include:"
      },
      {
        "type": "list",
        "items": [
          "repeated abusive messages;",
          "targeted intimidation;",
          "threats;",
          "sexual comments;",
          "discriminatory insults;",
          "persistent unwanted contact;",
          "malicious humiliation;",
          "unwanted sexual advances;",
          "threatening images;",
          "or other serious abusive behaviour."
        ]
      },
      {
        "type": "section",
        "num": "20",
        "title": "Academic Disagreement"
      },
      {
        "type": "paragraph",
        "text": "Academic disagreement, criticism, debate or correction does not automatically constitute harassment."
      },
      {
        "type": "paragraph",
        "text": "Lecturers may:"
      },
      {
        "type": "list",
        "items": [
          "correct Students;",
          "provide negative academic feedback;",
          "reject incorrect answers;",
          "challenge ideas;",
          "enforce reasonable Course rules; and",
          "issue appropriate academic instructions."
        ]
      },
      {
        "type": "paragraph",
        "text": "However, academic authority must not be used as a justification for abuse."
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "SEXUAL HARASSMENT"
      },
      {
        "type": "section",
        "num": "21",
        "title": "Sexual Harassment"
      },
      {
        "type": "paragraph",
        "text": "Sexual harassment is prohibited."
      },
      {
        "type": "paragraph",
        "text": "It may include:"
      },
      {
        "type": "list",
        "items": [
          "unwanted sexual messages;",
          "requests for sexual favours;",
          "sexual comments directed at another User;",
          "sending unsolicited sexual content;",
          "repeated romantic or sexual advances after rejection;",
          "sexual threats;",
          "exchanging grades for sexual activity; or",
          "using academic authority to obtain sexual access."
        ]
      },
      {
        "type": "section",
        "num": "22",
        "title": "Abuse of Academic Authority"
      },
      {
        "type": "paragraph",
        "text": "A Lecturer, Online Academy Owner or other authorised User must not condition:"
      },
      {
        "type": "list",
        "items": [
          "grades;",
          "admission;",
          "certification;",
          "Course access;",
          "academic progression;",
          "recommendations; or",
          "another educational benefit"
        ]
      },
      {
        "type": "paragraph",
        "text": "on sexual or romantic activity."
      },
      {
        "type": "paragraph",
        "text": "Such conduct may constitute serious misconduct."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "BULLYING"
      },
      {
        "type": "section",
        "num": "23",
        "title": "Bullying"
      },
      {
        "type": "paragraph",
        "text": "Bullying is prohibited where it involves repeated or serious behaviour intended or reasonably likely to intimidate, humiliate or harm another User."
      },
      {
        "type": "paragraph",
        "text": "Bullying may occur through:"
      },
      {
        "type": "list",
        "items": [
          "messages;",
          "comments;",
          "live classes;",
          "discussion areas;",
          "group activities;",
          "shared materials; or",
          "other JIT Campus functionality."
        ]
      },
      {
        "type": "section",
        "num": "24",
        "title": "Cyberbullying"
      },
      {
        "type": "paragraph",
        "text": "Users must not use digital functionality to organise or participate in targeted abuse of another User."
      },
      {
        "type": "paragraph",
        "text": "This includes coordinated harassment or deliberately encouraging others to attack a particular User."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "THREATS AND VIOLENCE"
      },
      {
        "type": "section",
        "num": "25",
        "title": "Threats"
      },
      {
        "type": "paragraph",
        "text": "Credible threats of serious violence against another User are prohibited."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may take immediate action where a communication creates a credible safety risk."
      },
      {
        "type": "section",
        "num": "26",
        "title": "Immediate Danger"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus becomes aware of circumstances indicating an immediate and serious risk to a person, Jorsas Tech may take appropriate steps including:"
      },
      {
        "type": "list",
        "items": [
          "restricting relevant Accounts;",
          "preserving relevant records;",
          "contacting appropriate authorities where legally permitted or required; or",
          "taking other reasonable safety measures."
        ]
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "ONLINE ACADEMY RESPONSIBILITIES"
      },
      {
        "type": "section",
        "num": "27",
        "title": "Online Academies Serving Adults"
      },
      {
        "type": "paragraph",
        "text": "Online Academies serving adult Students should maintain appropriate standards concerning:"
      },
      {
        "type": "list",
        "items": [
          "harassment;",
          "discrimination;",
          "professional boundaries;",
          "privacy;",
          "complaints; and",
          "Student safety."
        ]
      },
      {
        "type": "section",
        "num": "28",
        "title": "Online Academies Serving Children"
      },
      {
        "type": "paragraph",
        "text": "Online Academies choosing to provide services to children have additional responsibility."
      },
      {
        "type": "paragraph",
        "text": "They should determine what safeguarding arrangements are necessary for their activities and jurisdiction."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "parental consent;",
          "staff screening;",
          "child-protection policies;",
          "designated safeguarding personnel;",
          "reporting procedures;",
          "appropriate communication controls;",
          "staff training; and",
          "other legally required safeguards."
        ]
      },
      {
        "type": "section",
        "num": "29",
        "title": "Online Academy Owner Responsibility"
      },
      {
        "type": "paragraph",
        "text": "Online Academy Owners are responsible for deciding who receives privileged roles within their Online Academy."
      },
      {
        "type": "paragraph",
        "text": "They should take reasonable care when appointing people who will:"
      },
      {
        "type": "list",
        "items": [
          "communicate privately with Students;",
          "teach children;",
          "access sensitive Student information;",
          "manage safeguarding concerns; or",
          "exercise authority over Students."
        ]
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "LECTURER RESPONSIBILITIES"
      },
      {
        "type": "section",
        "num": "30",
        "title": "Professional Conduct"
      },
      {
        "type": "paragraph",
        "text": "Lecturers must:"
      },
      {
        "type": "list",
        "items": [
          "maintain appropriate boundaries;",
          "avoid exploiting Students;",
          "avoid harassment;",
          "respect Student privacy;",
          "comply with safeguarding requirements;",
          "report serious concerns appropriately; and",
          "avoid abusing their position of authority."
        ]
      },
      {
        "type": "section",
        "num": "31",
        "title": "Lecturer-Student Relationships"
      },
      {
        "type": "paragraph",
        "text": "Lecturers must not use their academic authority to pressure Students into personal, financial, romantic or sexual relationships."
      },
      {
        "type": "paragraph",
        "text": "Where a relationship creates a significant conflict of interest, the Lecturer should disclose it to the relevant Online Academy where appropriate."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "ADMISSION MARKETER RESPONSIBILITIES"
      },
      {
        "type": "section",
        "num": "32",
        "title": "Appropriate Conduct"
      },
      {
        "type": "paragraph",
        "text": "Admission Marketers must not exploit the admissions process to:"
      },
      {
        "type": "list",
        "items": [
          "harass applicants;",
          "solicit sexual activity;",
          "demand unauthorised payments;",
          "discriminate unlawfully;",
          "manipulate vulnerable applicants; or",
          "misuse applicant information."
        ]
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "STUDENT RESPONSIBILITIES"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Student Conduct"
      },
      {
        "type": "paragraph",
        "text": "Students must not:"
      },
      {
        "type": "list",
        "items": [
          "bully other Users;",
          "sexually harass others;",
          "threaten others;",
          "engage in discriminatory abuse;",
          "groom vulnerable Users;",
          "share exploitative content;",
          "stalk other Users; or",
          "deliberately interfere with another User’s safety."
        ]
      },
      {
        "type": "paragraph",
        "text": "Students remain entitled to make legitimate complaints and participate in good-faith academic debate."
      },
      {
        "type": "part",
        "label": "PART XVI",
        "title": "REPORTING CONCERNS"
      },
      {
        "type": "section",
        "num": "34",
        "title": "How Concerns May Be Reported"
      },
      {
        "type": "paragraph",
        "text": "Users should be provided with an accessible way to report serious safety concerns."
      },
      {
        "type": "paragraph",
        "text": "Depending on JIT Campus functionality, reports may be submitted through:"
      },
      {
        "type": "list",
        "items": [
          "an in-Platform reporting function;",
          "an Online Academy reporting process;",
          "JIT Campus support;",
          "a designated safeguarding contact; or",
          "another authorised reporting mechanism."
        ]
      },
      {
        "type": "section",
        "num": "35",
        "title": "Information to Include"
      },
      {
        "type": "paragraph",
        "text": "Where possible, a safeguarding or harassment report should include:"
      },
      {
        "type": "list",
        "items": [
          "what happened;",
          "who was involved;",
          "when it occurred;",
          "relevant Online Academy;",
          "relevant Course;",
          "screenshots or other evidence where available; and",
          "whether there is an immediate safety concern."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users should not put themselves at risk simply to obtain evidence."
      },
      {
        "type": "section",
        "num": "36",
        "title": "Good-Faith Reports"
      },
      {
        "type": "paragraph",
        "text": "Users should not be penalised merely for raising a genuine concern in good faith."
      },
      {
        "type": "paragraph",
        "text": "However, knowingly making a fabricated allegation for the purpose of harming another person may itself constitute misconduct."
      },
      {
        "type": "part",
        "label": "PART XVII",
        "title": "ONLINE ACADEMY OR JIT CAMPUS?"
      },
      {
        "type": "section",
        "num": "37",
        "title": "Issues Normally Managed by Online Academies"
      },
      {
        "type": "paragraph",
        "text": "Online Academies should ordinarily manage matters such as:"
      },
      {
        "type": "list",
        "items": [
          "classroom disputes;",
          "minor Student behaviour;",
          "Lecturer professionalism;",
          "ordinary complaints;",
          "Course-specific equality concerns; and",
          "other internal educational matters."
        ]
      },
      {
        "type": "section",
        "num": "38",
        "title": "Issues That May Be Reported Directly to JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Users may report serious matters directly to JIT Campus, including:"
      },
      {
        "type": "list",
        "items": [
          "child exploitation;",
          "grooming;",
          "credible threats of serious violence;",
          "serious sexual harassment;",
          "systematic abuse;",
          "serious privacy violations;",
          "fraud;",
          "Platform-wide harassment;",
          "serious Account misuse; or",
          "situations where an Online Academy is itself allegedly involved in serious misconduct."
        ]
      },
      {
        "type": "part",
        "label": "PART XVIII",
        "title": "INVESTIGATIONS"
      },
      {
        "type": "section",
        "num": "39",
        "title": "Review of Reports"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus receives a serious report, it may review information reasonably necessary to understand the allegation."
      },
      {
        "type": "paragraph",
        "text": "This may include relevant:"
      },
      {
        "type": "list",
        "items": [
          "Account information;",
          "Platform communications;",
          "activity logs;",
          "Course information;",
          "reports;",
          "uploaded materials; and",
          "other available Platform records."
        ]
      },
      {
        "type": "section",
        "num": "40",
        "title": "Fairness"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, a User accused of misconduct should be given an opportunity to respond before a final decision is made."
      },
      {
        "type": "paragraph",
        "text": "However, JIT Campus may impose temporary restrictions before receiving a response where necessary to protect Users or preserve Platform safety."
      },
      {
        "type": "section",
        "num": "41",
        "title": "Confidentiality"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding and harassment reports should be handled with appropriate confidentiality."
      },
      {
        "type": "paragraph",
        "text": "Information should only be shared where reasonably necessary for:"
      },
      {
        "type": "list",
        "items": [
          "investigation;",
          "safeguarding;",
          "legal compliance;",
          "safety;",
          "disciplinary action; or",
          "another legitimate purpose."
        ]
      },
      {
        "type": "paragraph",
        "text": "Absolute confidentiality cannot always be guaranteed, particularly where disclosure is legally required or necessary to protect a person."
      },
      {
        "type": "part",
        "label": "PART XIX",
        "title": "EMERGENCY AND SERIOUS CASES"
      },
      {
        "type": "section",
        "num": "42",
        "title": "Immediate Restrictions"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may immediately restrict an Account where there is a reasonable basis to believe that continued access creates an urgent risk involving:"
      },
      {
        "type": "list",
        "items": [
          "child exploitation;",
          "credible threats;",
          "sexual exploitation;",
          "serious harassment;",
          "active fraud;",
          "cybersecurity attacks; or",
          "another serious safety threat."
        ]
      },
      {
        "type": "section",
        "num": "43",
        "title": "Referral to Authorities"
      },
      {
        "type": "paragraph",
        "text": "Where required or appropriate under applicable law, Jorsas Tech may report serious matters to:"
      },
      {
        "type": "list",
        "items": [
          "law enforcement;",
          "child-protection authorities;",
          "regulators;",
          "emergency services; or",
          "other competent authorities."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will not guarantee that every complaint will be referred externally."
      },
      {
        "type": "paragraph",
        "text": "The decision will depend on the nature of the concern and applicable legal obligations."
      },
      {
        "type": "part",
        "label": "PART XX",
        "title": "RECORDS AND DATA PROTECTION"
      },
      {
        "type": "section",
        "num": "44",
        "title": "Safeguarding Records"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may retain appropriate records concerning serious safeguarding or harassment reports."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "the report;",
          "relevant evidence;",
          "investigation information;",
          "actions taken;",
          "communications; and",
          "outcome."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such information should be protected appropriately."
      },
      {
        "type": "section",
        "num": "45",
        "title": "Data Protection"
      },
      {
        "type": "paragraph",
        "text": "Personal information processed in connection with safeguarding, equality or harassment concerns will be handled in accordance with the JIT Campus Privacy Policy and applicable law."
      },
      {
        "type": "paragraph",
        "text": "Access should be restricted to those who reasonably require it."
      },
      {
        "type": "part",
        "label": "PART XXI",
        "title": "RETALIATION"
      },
      {
        "type": "section",
        "num": "46",
        "title": "Protection From Retaliation"
      },
      {
        "type": "paragraph",
        "text": "Users must not retaliate against another person merely because that person:"
      },
      {
        "type": "list",
        "items": [
          "reported a genuine safeguarding concern;",
          "made a harassment complaint;",
          "participated in an investigation;",
          "provided evidence; or",
          "exercised a legitimate right."
        ]
      },
      {
        "type": "paragraph",
        "text": "Retaliation may itself constitute misconduct."
      },
      {
        "type": "part",
        "label": "PART XXII",
        "title": "FALSE AND MALICIOUS REPORTS"
      },
      {
        "type": "section",
        "num": "47",
        "title": "False Allegations"
      },
      {
        "type": "paragraph",
        "text": "A report that is not ultimately proven does not automatically constitute a false report."
      },
      {
        "type": "paragraph",
        "text": "However, deliberately inventing an allegation while knowing it to be false, with the intention of harming another User, may result in action."
      },
      {
        "type": "part",
        "label": "PART XXIII",
        "title": "OUTCOMES"
      },
      {
        "type": "section",
        "num": "48",
        "title": "Online Academy-Level Outcomes"
      },
      {
        "type": "paragraph",
        "text": "Where the matter is appropriately handled by an Online Academy, possible outcomes may include:"
      },
      {
        "type": "list",
        "items": [
          "guidance;",
          "warning;",
          "change of Lecturer;",
          "communication restrictions;",
          "removal from a class;",
          "suspension from the Online Academy; or",
          "removal from the Online Academy."
        ]
      },
      {
        "type": "section",
        "num": "49",
        "title": "JIT Campus Platform-Level Outcomes"
      },
      {
        "type": "paragraph",
        "text": "Where Platform rules are breached, JIT Campus may:"
      },
      {
        "type": "list",
        "items": [
          "issue a warning;",
          "remove content;",
          "restrict communication;",
          "remove privileges;",
          "temporarily suspend an Account;",
          "suspend an Online Academy;",
          "terminate an Account; or",
          "take another proportionate safety measure."
        ]
      },
      {
        "type": "part",
        "label": "PART XXIV",
        "title": "NO RETALIATORY USE OF THE POLICY"
      },
      {
        "type": "section",
        "num": "50",
        "title": "Legitimate Expression"
      },
      {
        "type": "paragraph",
        "text": "This Policy should not be used to suppress legitimate:"
      },
      {
        "type": "list",
        "items": [
          "academic debate;",
          "criticism;",
          "complaints;",
          "disagreement;",
          "whistleblowing;",
          "Student feedback; or",
          "good-faith reporting."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users are entitled to disagree with Online Academies, Lecturers, Students and JIT Campus provided their conduct does not otherwise violate applicable rules."
      },
      {
        "type": "part",
        "label": "PART XXV",
        "title": "POLICY UPDATES"
      },
      {
        "type": "section",
        "num": "51",
        "title": "Changes to This Policy"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update this Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "new Platform functionality;",
          "emerging online safety risks;",
          "changes to applicable law;",
          "safeguarding developments;",
          "changes to the age groups using JIT Campus; or",
          "improvements to Platform governance."
        ]
      },
      {
        "type": "section",
        "num": "52",
        "title": "Relationship With Online Academy Policies"
      },
      {
        "type": "paragraph",
        "text": "Online Academies may establish their own safeguarding, equality and anti-harassment policies."
      },
      {
        "type": "paragraph",
        "text": "Where an Online Academy serves children or operates in a regulated educational environment, it may be required to maintain significantly more detailed safeguarding procedures than those contained in this Platform Policy."
      },
      {
        "type": "paragraph",
        "text": "Nothing in this Policy removes those responsibilities."
      },
      {
        "type": "section",
        "num": "53",
        "title": "Relationship With Other JIT Campus Policies"
      },
      {
        "type": "paragraph",
        "text": "This Policy should be read together with the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Privacy Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct;",
          "Academic Integrity Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "section",
        "num": "54",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "Ordinary Online Academy-related concerns should normally be raised with the relevant Online Academy."
      },
      {
        "type": "paragraph",
        "text": "Serious safeguarding or Platform safety concerns may be reported directly to JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "General Support: [Insert support email]"
      },
      {
        "type": "paragraph",
        "text": "Safeguarding Contact: [Insert dedicated safeguarding email]"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "paragraph",
        "text": "Where there is an immediate danger to life or safety, Users should contact the appropriate emergency service or competent authority in their location rather than relying solely on JIT Campus reporting mechanisms."
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "terms-and-conditions",
    "title": "JIT CAMPUS TERMS AND CONDITIONS",
    "shortTitle": "Terms & Conditions",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, designed to provide a comprehensive digital platform for education, teaching, learning, admissions and academic administration."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus brings together Students, Lecturers and Admission Marketers within one digital environment, enabling Students to discover and apply for programmes, receive admission support, enrol, learn, communicate with Lecturers, complete assessments and manage their academic journey."
      },
      {
        "type": "paragraph",
        "text": "These Terms and Conditions (“Terms”) govern your access to and use of JIT Campus, including its website, applications, learning environment, admission services, communication tools, educational content, payment facilities and any other products, features or services made available through JIT Campus (collectively, the “Platform” or “Services”)."
      },
      {
        "type": "paragraph",
        "text": "For the purposes of these Terms, “Jorsas Tech”, “JIT Campus”, “we”, “us” and “our” refer, where applicable, to Jorsas Tech as the provider and operator of JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "By creating an Account, submitting an application, enrolling on a Course or Programme, registering or operating as a Lecturer or Admission Marketer, purchasing or accessing a Service, or otherwise using JIT Campus, you agree to these Terms and all policies incorporated into them."
      },
      {
        "type": "paragraph",
        "text": "If you do not agree to these Terms, you must not use JIT Campus."
      },
      {
        "type": "section",
        "num": "2",
        "title": "Definitions"
      },
      {
        "type": "paragraph",
        "text": "For the purpose of these Terms:"
      },
      {
        "type": "paragraph",
        "text": "Account means a registered profile created by a User to access JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Admission Marketer means an authorised individual who uses JIT Campus to provide admission-related assistance to prospective or existing Students."
      },
      {
        "type": "paragraph",
        "text": "Course means an individual course, module, class, training programme or other learning offering provided through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Lecturer means a qualified or otherwise authorised individual who provides teaching, educational content, assessment, academic support or other learning services through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Platform means the JIT Campus website, applications, portals, learning systems, communication facilities and associated technology."
      },
      {
        "type": "paragraph",
        "text": "Programme means a structured programme of education or training consisting of one or more Courses or learning activities."
      },
      {
        "type": "paragraph",
        "text": "Services means the products, functionality, facilities and services provided through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Student means an individual who applies for, enrols on, purchases, accesses or participates in a Course or Programme through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "User means anyone who accesses or uses JIT Campus, including a Student, Lecturer or Admission Marketer."
      },
      {
        "type": "paragraph",
        "text": "User Content means information, documents, applications, assignments, messages, images, videos, learning materials or other content uploaded, submitted or created by a User through JIT Campus."
      },
      {
        "type": "section",
        "num": "3",
        "title": "Acceptance of These Terms"
      },
      {
        "type": "paragraph",
        "text": "By accessing or using JIT Campus, you confirm that:"
      },
      {
        "type": "paragraph",
        "text": "1. you have read and understood these Terms;"
      },
      {
        "type": "paragraph",
        "text": "2. you agree to comply with these Terms;"
      },
      {
        "type": "paragraph",
        "text": "3. you will comply with the policies applicable to your role;"
      },
      {
        "type": "paragraph",
        "text": "4. information and documentation you provide will be accurate and truthful;"
      },
      {
        "type": "paragraph",
        "text": "5. you have the legal capacity to enter into these Terms; and"
      },
      {
        "type": "paragraph",
        "text": "6. where you act on behalf of another person or organisation, you have appropriate authority to do so."
      },
      {
        "type": "paragraph",
        "text": "Your agreement to these Terms may be recorded electronically."
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus introduces additional terms for a particular Course, Programme or Service, those additional terms will also apply."
      },
      {
        "type": "section",
        "num": "4",
        "title": "Policies Incorporated Into These Terms"
      },
      {
        "type": "paragraph",
        "text": "These Terms should be read together with the other policies published by JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Depending on your role and the Services you use, these include:"
      },
      {
        "type": "list",
        "items": [
          "Privacy Policy;",
          "Cookie Policy;",
          "Admissions and Enrolment Policy;",
          "Fees, Payments, Refunds and Cancellation Policy;",
          "Academic Regulations and Assessment Policy;",
          "Academic Integrity Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct;",
          "Safeguarding, Equality and Anti-Harassment Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "paragraph",
        "text": "These policies form part of the rules governing your use of JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Where a specific policy applies to a particular activity, Users must comply with that policy in addition to these Terms."
      },
      {
        "type": "section",
        "num": "5",
        "title": "Eligibility to Use JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Access to particular JIT Campus Services may be subject to eligibility requirements."
      },
      {
        "type": "paragraph",
        "text": "Depending on the Service, JIT Campus may require:"
      },
      {
        "type": "list",
        "items": [
          "proof of identity;",
          "age verification;",
          "academic qualifications;",
          "professional qualifications;",
          "previous educational experience;",
          "employment or professional information;",
          "supporting documents; or",
          "other information reasonably required to establish eligibility."
        ]
      },
      {
        "type": "paragraph",
        "text": "Creating an Account does not guarantee admission to any Course or Programme."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus reserves the right to refuse, restrict or withdraw access where a User does not satisfy applicable eligibility requirements."
      },
      {
        "type": "paragraph",
        "text": "Where a User is legally unable to enter into these Terms independently because of their age, appropriate consent from a parent, guardian or other legally authorised person may be required."
      },
      {
        "type": "section",
        "num": "6",
        "title": "User Accounts"
      },
      {
        "type": "paragraph",
        "text": "Users may be required to create an Account before accessing certain Services."
      },
      {
        "type": "paragraph",
        "text": "Users must provide accurate, complete and current information."
      },
      {
        "type": "paragraph",
        "text": "Each User is responsible for maintaining the security of their Account and login credentials."
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "create an Account using a false identity;",
          "impersonate another person;",
          "provide fraudulent information or documents;",
          "create an Account for another person without authority;",
          "sell, transfer or otherwise give another person control of their Account;",
          "allow another person to complete academic activities using their Account;",
          "access another User’s Account without permission; or",
          "create another Account to circumvent a suspension, restriction or termination."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users must notify JIT Campus promptly where they reasonably believe their Account has been compromised."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may require additional verification where necessary to protect the Platform, Users or academic integrity."
      },
      {
        "type": "part",
        "label": "",
        "title": "STUDENTS AND ADMISSIONS"
      },
      {
        "type": "section",
        "num": "7",
        "title": "Student Applications"
      },
      {
        "type": "paragraph",
        "text": "Students may use JIT Campus to search for available Courses or Programmes and submit applications where applications are available through the Platform."
      },
      {
        "type": "paragraph",
        "text": "An application does not constitute an offer or guarantee of admission."
      },
      {
        "type": "paragraph",
        "text": "Students are responsible for ensuring that information provided in an application is accurate, complete and authentic."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may require supporting documentation including academic certificates, identification documents, professional qualifications or other evidence relevant to an application."
      },
      {
        "type": "paragraph",
        "text": "Providing materially false, altered, forged or misleading information may result in:"
      },
      {
        "type": "list",
        "items": [
          "rejection of an application;",
          "withdrawal of an admission offer;",
          "cancellation of enrolment;",
          "suspension or termination of an Account; or",
          "further action where required by law."
        ]
      },
      {
        "type": "paragraph",
        "text": "The detailed admission process is governed by the Admissions and Enrolment Policy."
      },
      {
        "type": "section",
        "num": "8",
        "title": "Admission Marketers"
      },
      {
        "type": "paragraph",
        "text": "Admission Marketers provide admission-related support through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Depending on their authorised functions, an Admission Marketer may assist Students with:"
      },
      {
        "type": "list",
        "items": [
          "understanding available Courses and Programmes;",
          "identifying relevant admission requirements;",
          "completing applications;",
          "understanding documentation requirements;",
          "tracking application progress;",
          "responding to admission-related questions; and",
          "navigating relevant areas of JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "Admission Marketers must act professionally, honestly and transparently."
      },
      {
        "type": "paragraph",
        "text": "An Admission Marketer must never:"
      },
      {
        "type": "list",
        "items": [
          "guarantee admission;",
          "fabricate or alter Student documents;",
          "knowingly submit false information;",
          "misrepresent a Course or Programme;",
          "make unauthorised promises on behalf of JIT Campus;",
          "demand unauthorised payments from Students;",
          "misuse Student personal information; or",
          "misrepresent themselves as having authority they do not possess."
        ]
      },
      {
        "type": "paragraph",
        "text": "Admission Marketers are subject to the Admission Marketer Code of Conduct."
      },
      {
        "type": "section",
        "num": "9",
        "title": "Admission Decisions"
      },
      {
        "type": "paragraph",
        "text": "Admission decisions will be made through the authorised JIT Campus admission process."
      },
      {
        "type": "paragraph",
        "text": "A recommendation or statement made by an Admission Marketer does not constitute an official admission decision unless expressly confirmed through an authorised JIT Campus process."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may:"
      },
      {
        "type": "list",
        "items": [
          "approve an application;",
          "reject an application;",
          "request additional information;",
          "request additional documentation;",
          "make a conditional offer; or",
          "withdraw an offer where legitimate grounds exist."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where an offer is conditional, the Student must satisfy the stated conditions before admission becomes final."
      },
      {
        "type": "section",
        "num": "10",
        "title": "Enrolment"
      },
      {
        "type": "paragraph",
        "text": "Admission and enrolment are separate stages."
      },
      {
        "type": "paragraph",
        "text": "Receiving an admission offer does not necessarily mean that a Student has completed enrolment."
      },
      {
        "type": "paragraph",
        "text": "A Student may be required to:"
      },
      {
        "type": "list",
        "items": [
          "accept an admission offer;",
          "verify their identity;",
          "provide outstanding documents;",
          "satisfy academic conditions;",
          "pay applicable fees;",
          "complete registration requirements; and",
          "accept applicable academic policies."
        ]
      },
      {
        "type": "paragraph",
        "text": "Enrolment becomes effective when JIT Campus confirms that the applicable requirements have been completed."
      },
      {
        "type": "part",
        "label": "",
        "title": "FEES AND PAYMENTS"
      },
      {
        "type": "section",
        "num": "11",
        "title": "Fees"
      },
      {
        "type": "paragraph",
        "text": "Certain JIT Campus Services, Courses or Programmes may require payment."
      },
      {
        "type": "paragraph",
        "text": "Applicable charges will normally be communicated before a Student enters into a paid transaction."
      },
      {
        "type": "paragraph",
        "text": "Students are responsible for reviewing the applicable price and payment terms before making payment."
      },
      {
        "type": "paragraph",
        "text": "Fees may include, depending on the Service:"
      },
      {
        "type": "list",
        "items": [
          "application fees;",
          "registration fees;",
          "Course or Programme fees;",
          "assessment fees;",
          "certification fees; or",
          "other charges clearly communicated before payment."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will not introduce undisclosed mandatory charges after a User has committed to a transaction."
      },
      {
        "type": "section",
        "num": "12",
        "title": "Payments"
      },
      {
        "type": "paragraph",
        "text": "Payments may be processed through authorised third-party payment providers."
      },
      {
        "type": "paragraph",
        "text": "Users must use payment methods that they are legally authorised to use."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may take reasonable steps to investigate:"
      },
      {
        "type": "list",
        "items": [
          "suspected fraudulent transactions;",
          "unauthorised payments;",
          "chargebacks;",
          "duplicate payments; or",
          "other payment irregularities."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where a payment fails, access to a paid Service may remain restricted until successful payment is confirmed."
      },
      {
        "type": "section",
        "num": "13",
        "title": "Refunds and Cancellations"
      },
      {
        "type": "paragraph",
        "text": "Refunds and cancellations are governed by the Fees, Payments, Refunds and Cancellation Policy."
      },
      {
        "type": "paragraph",
        "text": "The applicable refund terms should be made available before or at the point at which a Student purchases a paid Service."
      },
      {
        "type": "paragraph",
        "text": "A Student will not necessarily be entitled to a refund solely because the Student:"
      },
      {
        "type": "list",
        "items": [
          "fails to attend;",
          "fails to participate;",
          "fails an assessment;",
          "does not complete the Course;",
          "receives a result below their expectations; or",
          "is removed from a Course because of serious misconduct."
        ]
      },
      {
        "type": "paragraph",
        "text": "Nothing in these Terms removes any statutory consumer right that cannot legally be excluded."
      },
      {
        "type": "part",
        "label": "",
        "title": "TEACHING AND ACADEMIC SERVICES"
      },
      {
        "type": "section",
        "num": "14",
        "title": "Lecturers"
      },
      {
        "type": "paragraph",
        "text": "Lecturers are responsible for carrying out their authorised teaching and academic responsibilities professionally."
      },
      {
        "type": "paragraph",
        "text": "Depending on their role, Lecturers may:"
      },
      {
        "type": "list",
        "items": [
          "create or deliver learning content;",
          "conduct classes;",
          "communicate with Students;",
          "provide academic guidance;",
          "set assessments;",
          "review Student work;",
          "provide feedback;",
          "grade assessments; and",
          "monitor Student academic progress."
        ]
      },
      {
        "type": "paragraph",
        "text": "Lecturers must comply with the Lecturer Code of Conduct and Teaching Standards."
      },
      {
        "type": "paragraph",
        "text": "Lecturers must maintain appropriate professional boundaries with Students and must not exploit their position for personal, financial, sexual or other improper purposes."
      },
      {
        "type": "section",
        "num": "15",
        "title": "Learning Materials"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide Students with access to:"
      },
      {
        "type": "list",
        "items": [
          "lecture notes;",
          "presentations;",
          "videos;",
          "live or recorded classes;",
          "reading materials;",
          "assignments;",
          "quizzes;",
          "examinations;",
          "exercises;",
          "projects; and",
          "other educational resources."
        ]
      },
      {
        "type": "paragraph",
        "text": "Unless expressly stated otherwise, access is provided for the Student’s personal educational use."
      },
      {
        "type": "paragraph",
        "text": "Students must not unlawfully reproduce, sell, publish, redistribute or commercially exploit protected educational content."
      },
      {
        "type": "section",
        "num": "16",
        "title": "Assessments and Examinations"
      },
      {
        "type": "paragraph",
        "text": "Courses may include assessments, examinations, assignments, quizzes, projects or practical activities."
      },
      {
        "type": "paragraph",
        "text": "Students must comply with applicable:"
      },
      {
        "type": "list",
        "items": [
          "assessment instructions;",
          "deadlines;",
          "examination rules;",
          "identity verification requirements;",
          "submission requirements; and",
          "academic integrity standards."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may use appropriate measures to protect the integrity of assessments and verify that submitted work belongs to the Student concerned."
      },
      {
        "type": "paragraph",
        "text": "Detailed rules are contained in the Academic Regulations and Assessment Policy."
      },
      {
        "type": "section",
        "num": "17",
        "title": "Academic Integrity"
      },
      {
        "type": "paragraph",
        "text": "Students are expected to produce genuine academic work."
      },
      {
        "type": "paragraph",
        "text": "Academic misconduct may include:"
      },
      {
        "type": "list",
        "items": [
          "plagiarism;",
          "cheating;",
          "collusion;",
          "impersonation;",
          "contract cheating;",
          "purchasing assignments;",
          "fabrication or falsification;",
          "unauthorised assistance;",
          "manipulation of academic records; and",
          "prohibited or undisclosed use of artificial intelligence."
        ]
      },
      {
        "type": "paragraph",
        "text": "Suspected academic misconduct may be investigated."
      },
      {
        "type": "paragraph",
        "text": "Where misconduct is established, proportionate sanctions may be imposed in accordance with the Academic Integrity Policy."
      },
      {
        "type": "section",
        "num": "18",
        "title": "Artificial Intelligence"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus recognises that artificial intelligence may form part of modern education."
      },
      {
        "type": "paragraph",
        "text": "AI may be permitted for certain educational activities where authorised."
      },
      {
        "type": "paragraph",
        "text": "However, Students must comply with instructions concerning whether AI may be used for a particular assessment or academic activity."
      },
      {
        "type": "paragraph",
        "text": "Where disclosure of AI assistance is required, Students must disclose such use appropriately."
      },
      {
        "type": "paragraph",
        "text": "AI must not be used to impersonate another person, fabricate evidence, falsify academic work or circumvent assessment requirements."
      },
      {
        "type": "part",
        "label": "",
        "title": "USER CONDUCT AND SAFETY"
      },
      {
        "type": "section",
        "num": "19",
        "title": "Code of Conduct"
      },
      {
        "type": "paragraph",
        "text": "Every User must behave respectfully and lawfully when using JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Users must not use JIT Campus to:"
      },
      {
        "type": "list",
        "items": [
          "harass, bully or intimidate another person;",
          "discriminate unlawfully;",
          "sexually harass another User;",
          "exploit a Student or other User;",
          "threaten violence;",
          "facilitate fraud;",
          "distribute unlawful content;",
          "impersonate another person;",
          "compromise another Account;",
          "interfere with Platform security;",
          "introduce malicious software;",
          "obtain unauthorised access to data or systems;",
          "misuse another person’s personal information;",
          "facilitate academic fraud; or",
          "conduct any other unlawful activity."
        ]
      },
      {
        "type": "paragraph",
        "text": "Different roles may be subject to additional Codes of Conduct."
      },
      {
        "type": "section",
        "num": "20",
        "title": "Safeguarding"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is committed to providing a safe learning environment."
      },
      {
        "type": "paragraph",
        "text": "Users must not engage in abuse, exploitation, grooming, sexual misconduct, harassment or other behaviour that places another person at risk."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may take immediate protective measures where it reasonably considers that a User may be at risk."
      },
      {
        "type": "paragraph",
        "text": "Serious concerns may be reported to relevant authorities where legally required or appropriate."
      },
      {
        "type": "paragraph",
        "text": "Detailed requirements are contained in the Safeguarding, Equality and Anti-Harassment Policy."
      },
      {
        "type": "part",
        "label": "",
        "title": "DATA PROTECTION AND PRIVACY"
      },
      {
        "type": "section",
        "num": "21",
        "title": "Personal Data"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may process personal information necessary to provide and administer its Services."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "names and contact information;",
          "identity information;",
          "Account information;",
          "application and admission records;",
          "academic information;",
          "qualifications;",
          "assessment results;",
          "payment information;",
          "communications;",
          "Platform activity;",
          "technical information; and",
          "safeguarding information where applicable."
        ]
      },
      {
        "type": "paragraph",
        "text": "Personal information will be handled in accordance with the JIT Campus Privacy Policy and applicable data protection requirements."
      },
      {
        "type": "section",
        "num": "22",
        "title": "User Content"
      },
      {
        "type": "paragraph",
        "text": "Users may submit documents, assignments, messages, educational materials and other content through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Users retain ownership of intellectual property rights they legitimately hold in their User Content."
      },
      {
        "type": "paragraph",
        "text": "Users grant JIT Campus the permissions reasonably necessary to store, process, display and use User Content for the provision, administration, security and operation of the relevant Services."
      },
      {
        "type": "paragraph",
        "text": "Users must not upload content that they do not have the legal right to use."
      },
      {
        "type": "part",
        "label": "",
        "title": "INTELLECTUAL PROPERTY"
      },
      {
        "type": "section",
        "num": "23",
        "title": "JIT Campus Intellectual Property"
      },
      {
        "type": "paragraph",
        "text": "Unless otherwise stated, intellectual property belonging to Jorsas Tech or JIT Campus remains the property of the relevant owner."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "the JIT Campus name and branding;",
          "software;",
          "Platform architecture;",
          "website and application design;",
          "databases;",
          "graphics;",
          "documentation;",
          "original educational resources; and",
          "proprietary technology."
        ]
      },
      {
        "type": "paragraph",
        "text": "Use of JIT Campus does not transfer ownership of this intellectual property to Users."
      },
      {
        "type": "section",
        "num": "24",
        "title": "Lecturer Content"
      },
      {
        "type": "paragraph",
        "text": "Lecturers must only upload or deliver materials they are legally entitled to use."
      },
      {
        "type": "paragraph",
        "text": "Ownership and licensing of Lecturer-created content may be governed by the Lecturer’s agreement with JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Where required for the delivery of a Course, the Lecturer grants the necessary permissions for JIT Campus to host, display and make authorised educational use of that material in accordance with the applicable agreement."
      },
      {
        "type": "part",
        "label": "",
        "title": "PLATFORM OPERATION"
      },
      {
        "type": "section",
        "num": "25",
        "title": "Platform Availability"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will take reasonable steps to maintain the availability and security of the Platform."
      },
      {
        "type": "paragraph",
        "text": "However, uninterrupted or error-free operation cannot be guaranteed."
      },
      {
        "type": "paragraph",
        "text": "Services may occasionally be interrupted because of maintenance, upgrades, security incidents, telecommunications failures, third-party failures or circumstances outside JIT Campus’s reasonable control."
      },
      {
        "type": "section",
        "num": "26",
        "title": "Changes to Courses and Services"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may make reasonable changes to Courses, Programmes or Platform functionality for academic, regulatory, technical, security or operational reasons."
      },
      {
        "type": "paragraph",
        "text": "Where a material change significantly affects an enrolled Student, JIT Campus will take reasonable steps to provide appropriate information about the change."
      },
      {
        "type": "part",
        "label": "",
        "title": "SUSPENSION AND TERMINATION"
      },
      {
        "type": "section",
        "num": "27",
        "title": "Account Suspension"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may temporarily restrict or suspend an Account where reasonably necessary to:"
      },
      {
        "type": "list",
        "items": [
          "investigate misconduct;",
          "protect another User;",
          "prevent fraud;",
          "investigate academic misconduct;",
          "protect Platform security;",
          "address serious payment issues;",
          "comply with legal obligations; or",
          "investigate a serious breach of these Terms."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, the affected User will be informed of the reason and any available review or appeal procedure."
      },
      {
        "type": "section",
        "num": "28",
        "title": "Account Termination"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may terminate access for serious or repeated violations."
      },
      {
        "type": "paragraph",
        "text": "Grounds may include:"
      },
      {
        "type": "list",
        "items": [
          "fraud;",
          "falsification of identity;",
          "forged documents;",
          "serious academic misconduct;",
          "safeguarding violations;",
          "harassment or exploitation;",
          "serious misuse of personal information;",
          "unlawful activity;",
          "deliberate attacks against Platform security; or",
          "repeated violations following previous warnings."
        ]
      },
      {
        "type": "paragraph",
        "text": "Termination will be handled fairly and in accordance with applicable policies and legal requirements."
      },
      {
        "type": "part",
        "label": "",
        "title": "COMPLAINTS AND APPEALS"
      },
      {
        "type": "section",
        "num": "29",
        "title": "Complaints"
      },
      {
        "type": "paragraph",
        "text": "Students, Lecturers and Admission Marketers may raise complaints regarding JIT Campus Services or conduct through the designated complaints process."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will seek to investigate complaints fairly, objectively and within reasonable timescales."
      },
      {
        "type": "paragraph",
        "text": "Detailed procedures are contained in the Complaints, Appeals and Dispute Resolution Policy."
      },
      {
        "type": "section",
        "num": "30",
        "title": "Academic Appeals"
      },
      {
        "type": "paragraph",
        "text": "Students may appeal eligible academic decisions where recognised grounds for appeal exist."
      },
      {
        "type": "paragraph",
        "text": "Dissatisfaction with a grade alone does not necessarily constitute grounds for an academic appeal."
      },
      {
        "type": "paragraph",
        "text": "Applicable grounds, evidence requirements, deadlines and review procedures will be specified in the relevant academic regulations and appeals process."
      },
      {
        "type": "part",
        "label": "",
        "title": "RESPONSIBILITY AND LIABILITY"
      },
      {
        "type": "section",
        "num": "31",
        "title": "Educational Outcomes"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will seek to provide its Services with reasonable care and skill."
      },
      {
        "type": "paragraph",
        "text": "However, participation in a JIT Campus Course or Programme does not, unless expressly stated otherwise, guarantee:"
      },
      {
        "type": "list",
        "items": [
          "a particular grade;",
          "successful Course completion;",
          "employment;",
          "promotion;",
          "professional registration;",
          "admission to another educational institution;",
          "immigration or visa approval;",
          "a particular level of income; or",
          "any other specific personal or professional outcome."
        ]
      },
      {
        "type": "paragraph",
        "text": "Students remain responsible for their participation, academic effort and compliance with Course requirements."
      },
      {
        "type": "section",
        "num": "32",
        "title": "Liability"
      },
      {
        "type": "paragraph",
        "text": "Nothing in these Terms excludes or restricts liability where doing so would be unlawful."
      },
      {
        "type": "paragraph",
        "text": "Subject to applicable law, JIT Campus will not be responsible for losses that were not reasonably foreseeable or that result solely from circumstances outside its reasonable control."
      },
      {
        "type": "paragraph",
        "text": "Nothing in these Terms is intended to remove mandatory rights available to Users under applicable law."
      },
      {
        "type": "part",
        "label": "",
        "title": "CHANGES TO THESE TERMS"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Updates"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may update these Terms where reasonably necessary because of:"
      },
      {
        "type": "list",
        "items": [
          "changes to the Platform;",
          "new Services;",
          "changes in law or regulation;",
          "academic requirements;",
          "security requirements; or",
          "operational changes."
        ]
      },
      {
        "type": "paragraph",
        "text": "The current version will be published on JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Where a change materially affects existing Users’ rights or obligations, appropriate notice will be provided where required."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may require Users to accept updated Terms before continuing to use particular Services."
      },
      {
        "type": "part",
        "label": "",
        "title": "GENERAL LEGAL TERMS"
      },
      {
        "type": "section",
        "num": "34",
        "title": "Severability"
      },
      {
        "type": "paragraph",
        "text": "If any provision of these Terms is determined to be invalid or unenforceable, the remaining provisions will continue to apply to the extent permitted by law."
      },
      {
        "type": "section",
        "num": "35",
        "title": "No Waiver"
      },
      {
        "type": "paragraph",
        "text": "Failure by JIT Campus to immediately enforce a provision does not mean that JIT Campus permanently waives its right to enforce that provision."
      },
      {
        "type": "section",
        "num": "36",
        "title": "Entire Agreement"
      },
      {
        "type": "paragraph",
        "text": "These Terms, together with the policies and additional terms expressly incorporated into them, constitute the applicable agreement governing use of JIT Campus."
      },
      {
        "type": "section",
        "num": "37",
        "title": "Governing Law and Jurisdiction"
      },
      {
        "type": "paragraph",
        "text": "These Terms shall be governed by the laws applicable to the Jorsas Tech entity operating JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "The specific governing jurisdiction and dispute forum should correspond to the country in which the operating Jorsas Tech entity is legally registered and from which JIT Campus is provided."
      },
      {
        "type": "part",
        "label": "",
        "title": "CONTACT AND POLICY ACCEPTANCE"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Contact"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will provide official contact channels for matters including:"
      },
      {
        "type": "list",
        "items": [
          "general support;",
          "admissions;",
          "academic enquiries;",
          "payments;",
          "complaints and appeals;",
          "safeguarding; and",
          "privacy and data protection."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users should use the appropriate official channel when contacting JIT Campus."
      },
      {
        "type": "section",
        "num": "39",
        "title": "Acceptance Record"
      },
      {
        "type": "paragraph",
        "text": "Where acceptance of these Terms is required, JIT Campus may maintain an electronic record containing information such as:"
      },
      {
        "type": "list",
        "items": [
          "the User;",
          "version of the Terms accepted;",
          "date and time of acceptance; and",
          "other appropriate audit information."
        ]
      },
      {
        "type": "paragraph",
        "text": "This enables JIT Campus to maintain evidence of the Terms applicable to a User at a particular time."
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  },
  {
    "id": "privacy-policy",
    "title": "JIT CAMPUS PRIVACY POLICY",
    "shortTitle": "Privacy",
    "lastUpdated": "18 August 2026",
    "effectiveDate": "18 August 2026",
    "blocks": [
      {
        "type": "section",
        "num": "1",
        "title": "Introduction"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is a product of Jorsas Tech, designed to provide a comprehensive digital platform for education, teaching, learning, admissions and academic administration."
      },
      {
        "type": "paragraph",
        "text": "This Privacy Policy explains how Jorsas Tech, through JIT Campus (“JIT Campus”, “Jorsas Tech”, “we”, “us” or “our”), collects, uses, stores, shares, protects and otherwise processes personal information when individuals access or use JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "This Policy applies to personal information relating to users of JIT Campus, including:"
      },
      {
        "type": "list",
        "items": [
          "Students and prospective Students;",
          "Lecturers and prospective Lecturers;",
          "Admission Marketers and prospective Admission Marketers;",
          "website visitors;",
          "individuals who contact JIT Campus;",
          "authorised representatives of Users; and",
          "other individuals whose personal information is legitimately processed through the Platform."
        ]
      },
      {
        "type": "paragraph",
        "text": "We recognise that education involves information that can be important to an individual’s identity, academic history and future opportunities. JIT Campus therefore seeks to process personal information responsibly, transparently, securely and only for legitimate purposes."
      },
      {
        "type": "paragraph",
        "text": "This Privacy Policy should be read together with the JIT Campus Terms and Conditions and any other privacy information provided when personal information is collected."
      },
      {
        "type": "part",
        "label": "PART I",
        "title": "WHO WE ARE"
      },
      {
        "type": "section",
        "num": "2",
        "title": "JIT Campus and Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus is operated as a product of Jorsas Tech."
      },
      {
        "type": "paragraph",
        "text": "Jorsas Tech determines how and why personal information is processed for many of the activities described in this Policy."
      },
      {
        "type": "paragraph",
        "text": "For certain Services, another organisation may also determine how personal information is processed. Where this occurs, the respective responsibilities of JIT Campus and the organisation will be determined by the nature of the Service and applicable data protection requirements."
      },
      {
        "type": "paragraph",
        "text": "The appropriate Jorsas Tech legal entity details, registered address and privacy contact information should be displayed on the Platform."
      },
      {
        "type": "section",
        "num": "3",
        "title": "Scope of This Privacy Policy"
      },
      {
        "type": "paragraph",
        "text": "This Policy applies when you:"
      },
      {
        "type": "list",
        "items": [
          "visit the JIT Campus website;",
          "create an Account;",
          "apply for admission;",
          "upload application documents;",
          "enrol on a Course or Programme;",
          "participate in learning activities;",
          "submit assignments or assessments;",
          "communicate through JIT Campus;",
          "interact with a Lecturer;",
          "receive support from an Admission Marketer;",
          "make or receive payments where applicable;",
          "provide teaching or admission services;",
          "contact JIT Campus;",
          "submit a complaint or appeal; or",
          "otherwise use the Platform or Services."
        ]
      },
      {
        "type": "part",
        "label": "PART II",
        "title": "INFORMATION WE COLLECT"
      },
      {
        "type": "section",
        "num": "4",
        "title": "Account and Identity Information"
      },
      {
        "type": "paragraph",
        "text": "When you create or use an Account, we may collect:"
      },
      {
        "type": "list",
        "items": [
          "full name;",
          "username;",
          "date of birth where required;",
          "profile photograph;",
          "gender where legitimately required;",
          "contact details;",
          "country or location information;",
          "Account type;",
          "login information;",
          "identity verification information; and",
          "other information necessary to establish and administer your Account."
        ]
      },
      {
        "type": "paragraph",
        "text": "We will not request information merely because it may be useful. Information collected should be relevant to a defined purpose."
      },
      {
        "type": "section",
        "num": "5",
        "title": "Student and Applicant Information"
      },
      {
        "type": "paragraph",
        "text": "For prospective and existing Students, we may process information including:"
      },
      {
        "type": "list",
        "items": [
          "application information;",
          "educational history;",
          "qualifications;",
          "certificates;",
          "transcripts;",
          "previous institutions;",
          "professional experience;",
          "Course or Programme choices;",
          "admission status;",
          "admission decisions;",
          "enrolment information;",
          "Student identification information;",
          "academic progress;",
          "attendance or participation records;",
          "assignments;",
          "assessment results;",
          "grades;",
          "Lecturer feedback;",
          "academic integrity records;",
          "completion status;",
          "certificates awarded;",
          "deferral or withdrawal information; and",
          "complaints or appeals."
        ]
      },
      {
        "type": "paragraph",
        "text": "The precise information collected will depend on the Course, Programme and Services being used."
      },
      {
        "type": "section",
        "num": "6",
        "title": "Lecturer Information"
      },
      {
        "type": "paragraph",
        "text": "Where a person applies to become or operates as a Lecturer, we may process:"
      },
      {
        "type": "list",
        "items": [
          "identity information;",
          "contact information;",
          "photograph;",
          "academic qualifications;",
          "professional qualifications;",
          "teaching experience;",
          "employment or professional history;",
          "expertise and subject areas;",
          "verification records;",
          "Course assignments;",
          "teaching activities;",
          "Student feedback;",
          "quality assurance information;",
          "performance-related information;",
          "complaints or disciplinary information where applicable;",
          "payment information where Lecturers receive payment; and",
          "other information required to administer the Lecturer relationship."
        ]
      },
      {
        "type": "section",
        "num": "7",
        "title": "Admission Marketer Information"
      },
      {
        "type": "paragraph",
        "text": "Where a person applies to become or operates as an Admission Marketer, we may process:"
      },
      {
        "type": "list",
        "items": [
          "identity information;",
          "contact details;",
          "professional information;",
          "verification information;",
          "assigned Students or applications;",
          "activity records;",
          "communications;",
          "application support history;",
          "performance information;",
          "complaints;",
          "compliance information;",
          "payment or commission information where applicable; and",
          "other information necessary to administer their role."
        ]
      },
      {
        "type": "section",
        "num": "8",
        "title": "Documents Uploaded to JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Users may be required or permitted to upload documents including:"
      },
      {
        "type": "list",
        "items": [
          "identification documents;",
          "academic certificates;",
          "transcripts;",
          "professional qualifications;",
          "supporting statements;",
          "CVs;",
          "assignments;",
          "evidence submitted for appeals;",
          "complaint documentation; and",
          "other documents relevant to JIT Campus Services."
        ]
      },
      {
        "type": "paragraph",
        "text": "Users should only upload information that is required or reasonably relevant to the purpose for which the upload facility is provided."
      },
      {
        "type": "section",
        "num": "9",
        "title": "Payment and Transaction Information"
      },
      {
        "type": "paragraph",
        "text": "Where payments are made through JIT Campus, we may process:"
      },
      {
        "type": "list",
        "items": [
          "transaction reference;",
          "amount;",
          "currency;",
          "payment status;",
          "date and time;",
          "payment provider information;",
          "refund information;",
          "billing information where required; and",
          "information necessary to investigate payment disputes or fraud."
        ]
      },
      {
        "type": "paragraph",
        "text": "Payments may be processed by third-party payment service providers."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should avoid storing complete payment-card details where those details can instead be processed securely by an authorised payment provider."
      },
      {
        "type": "section",
        "num": "10",
        "title": "Communications"
      },
      {
        "type": "paragraph",
        "text": "Where Users communicate through JIT Campus, we may process information relating to those communications."
      },
      {
        "type": "paragraph",
        "text": "This may include communications between:"
      },
      {
        "type": "list",
        "items": [
          "Students and Lecturers;",
          "Students and Admission Marketers;",
          "Users and JIT Campus support;",
          "Users and academic administrators;",
          "Users and safeguarding personnel; and",
          "Users and complaints or appeals personnel."
        ]
      },
      {
        "type": "paragraph",
        "text": "Depending on the functionality provided, this may include messages, attachments, dates, times, participants and other communication metadata."
      },
      {
        "type": "section",
        "num": "11",
        "title": "Technical and Usage Information"
      },
      {
        "type": "paragraph",
        "text": "When you access JIT Campus, certain information may be generated automatically."
      },
      {
        "type": "paragraph",
        "text": "This may include:"
      },
      {
        "type": "list",
        "items": [
          "IP address;",
          "device type;",
          "operating system;",
          "browser type;",
          "application version;",
          "login date and time;",
          "pages or areas accessed;",
          "session information;",
          "device identifiers where appropriate;",
          "error and diagnostic information;",
          "security logs; and",
          "Platform activity."
        ]
      },
      {
        "type": "paragraph",
        "text": "This information may be used to operate, secure, troubleshoot and improve JIT Campus."
      },
      {
        "type": "section",
        "num": "12",
        "title": "Cookies and Similar Technologies"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may use cookies and similar technologies to:"
      },
      {
        "type": "list",
        "items": [
          "maintain User sessions;",
          "remember preferences;",
          "provide essential functionality;",
          "improve performance;",
          "understand Platform usage;",
          "prevent fraud; and",
          "support analytics."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where consent is legally required for non-essential cookies or similar technologies, JIT Campus will seek appropriate consent."
      },
      {
        "type": "paragraph",
        "text": "Further information is provided in the JIT Campus Cookie Policy."
      },
      {
        "type": "section",
        "num": "13",
        "title": "Sensitive or Special Categories of Information"
      },
      {
        "type": "paragraph",
        "text": "In some circumstances, JIT Campus may need to process information that is considered sensitive under applicable data protection law."
      },
      {
        "type": "paragraph",
        "text": "This could include information relating to:"
      },
      {
        "type": "list",
        "items": [
          "health or disability where accommodations are requested;",
          "safeguarding matters;",
          "ethnicity or similar characteristics where legitimately collected for equality purposes;",
          "biometric information where an approved identity verification process requires it; or",
          "other legally protected categories of personal information."
        ]
      },
      {
        "type": "paragraph",
        "text": "Such information will only be processed where there is an appropriate purpose and lawful basis and where any additional legal conditions required for sensitive information have been satisfied."
      },
      {
        "type": "part",
        "label": "PART III",
        "title": "HOW WE COLLECT INFORMATION"
      },
      {
        "type": "section",
        "num": "14",
        "title": "Information You Provide Directly"
      },
      {
        "type": "paragraph",
        "text": "We may collect information directly from you when you:"
      },
      {
        "type": "list",
        "items": [
          "register;",
          "complete your profile;",
          "submit an application;",
          "upload documents;",
          "enrol;",
          "complete academic activities;",
          "communicate through the Platform;",
          "make a payment;",
          "contact support;",
          "make a complaint;",
          "submit an appeal; or",
          "otherwise provide information to us."
        ]
      },
      {
        "type": "section",
        "num": "15",
        "title": "Information Provided by Other Users"
      },
      {
        "type": "paragraph",
        "text": "In certain circumstances, personal information about you may be provided by another authorised User."
      },
      {
        "type": "paragraph",
        "text": "For example:"
      },
      {
        "type": "list",
        "items": [
          "a Lecturer may record assessment information;",
          "an Admission Marketer may update an application;",
          "authorised staff may create academic or administrative records; or",
          "another User may identify you in a legitimate complaint or safeguarding report."
        ]
      },
      {
        "type": "section",
        "num": "16",
        "title": "Information from Third Parties"
      },
      {
        "type": "paragraph",
        "text": "Where appropriate, information may be obtained from third parties such as:"
      },
      {
        "type": "list",
        "items": [
          "payment providers;",
          "identity verification providers;",
          "educational institutions;",
          "professional bodies;",
          "technology providers; or",
          "other authorised sources."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where verification is required, JIT Campus may seek to confirm that information or documentation supplied by a User is authentic."
      },
      {
        "type": "part",
        "label": "PART IV",
        "title": "WHY WE USE PERSONAL INFORMATION"
      },
      {
        "type": "section",
        "num": "17",
        "title": "Providing JIT Campus Services"
      },
      {
        "type": "paragraph",
        "text": "We may use personal information to:"
      },
      {
        "type": "list",
        "items": [
          "create and administer Accounts;",
          "process applications;",
          "determine admission eligibility;",
          "manage enrolment;",
          "provide Courses and Programmes;",
          "deliver educational content;",
          "administer assessments;",
          "record results;",
          "monitor academic progression;",
          "issue certificates where applicable;",
          "provide admission assistance;",
          "support Students;",
          "manage Lecturer activities;",
          "manage Admission Marketer activities; and",
          "otherwise operate JIT Campus."
        ]
      },
      {
        "type": "section",
        "num": "18",
        "title": "Communications"
      },
      {
        "type": "paragraph",
        "text": "We may use contact information to send:"
      },
      {
        "type": "list",
        "items": [
          "Account notifications;",
          "application updates;",
          "admission decisions;",
          "Course information;",
          "assessment notifications;",
          "deadline reminders;",
          "security alerts;",
          "payment information;",
          "policy updates;",
          "service announcements; and",
          "other communications necessary for the operation of JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where marketing communications are sent, Users will be provided with appropriate controls as required by applicable law."
      },
      {
        "type": "section",
        "num": "19",
        "title": "Academic Integrity and Quality"
      },
      {
        "type": "paragraph",
        "text": "Personal information may be used to:"
      },
      {
        "type": "list",
        "items": [
          "administer assessments;",
          "verify Student identity;",
          "investigate suspected plagiarism or cheating;",
          "investigate impersonation;",
          "maintain academic records;",
          "monitor teaching quality;",
          "review complaints concerning teaching; and",
          "maintain academic standards."
        ]
      },
      {
        "type": "section",
        "num": "20",
        "title": "Safety and Safeguarding"
      },
      {
        "type": "paragraph",
        "text": "Where necessary, information may be processed to:"
      },
      {
        "type": "list",
        "items": [
          "protect Users;",
          "investigate safeguarding concerns;",
          "investigate harassment or abuse;",
          "respond to threats;",
          "prevent exploitation;",
          "enforce User conduct requirements; and",
          "make appropriate referrals where a serious risk exists."
        ]
      },
      {
        "type": "paragraph",
        "text": "Access to safeguarding information should be restricted to individuals who require it for legitimate purposes."
      },
      {
        "type": "section",
        "num": "21",
        "title": "Security and Fraud Prevention"
      },
      {
        "type": "paragraph",
        "text": "We may process information to:"
      },
      {
        "type": "list",
        "items": [
          "protect Accounts;",
          "detect suspicious activity;",
          "prevent unauthorised access;",
          "investigate fraud;",
          "protect Platform infrastructure;",
          "investigate security incidents;",
          "maintain audit logs; and",
          "enforce JIT Campus Terms and policies."
        ]
      },
      {
        "type": "section",
        "num": "22",
        "title": "Legal and Regulatory Requirements"
      },
      {
        "type": "paragraph",
        "text": "Information may be processed where necessary to:"
      },
      {
        "type": "list",
        "items": [
          "comply with applicable law;",
          "respond to valid legal requests;",
          "establish or defend legal claims;",
          "comply with regulatory requirements;",
          "investigate misconduct;",
          "protect legal rights; or",
          "cooperate with competent authorities where legally required."
        ]
      },
      {
        "type": "part",
        "label": "PART V",
        "title": "OUR BASIS FOR PROCESSING"
      },
      {
        "type": "section",
        "num": "23",
        "title": "Lawful Processing"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will process personal information only where there is an appropriate legal basis under the data protection laws applicable to the relevant processing."
      },
      {
        "type": "paragraph",
        "text": "Depending on the circumstances, processing may be necessary:"
      },
      {
        "type": "list",
        "items": [
          "to perform a contract with a User;",
          "to take steps requested before entering into a contract;",
          "to comply with a legal obligation;",
          "for legitimate interests pursued by JIT Campus or another party where those interests are not overridden by the individual’s rights;",
          "to protect vital interests;",
          "to perform functions in the public interest where applicable; or",
          "where valid consent has been obtained."
        ]
      },
      {
        "type": "paragraph",
        "text": "The appropriate basis depends on the specific processing activity."
      },
      {
        "type": "paragraph",
        "text": "Consent will not be presented as the basis for processing where another legal basis is actually relied upon."
      },
      {
        "type": "part",
        "label": "PART VI",
        "title": "SHARING PERSONAL INFORMATION"
      },
      {
        "type": "section",
        "num": "24",
        "title": "Within JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Personal information will only be made available internally where reasonably necessary for the recipient’s role."
      },
      {
        "type": "paragraph",
        "text": "For example:"
      },
      {
        "type": "list",
        "items": [
          "Lecturers may access information about Students they teach;",
          "Admission Marketers may access information necessary to support assigned applicants;",
          "academic administrators may access academic records;",
          "finance personnel may access relevant payment records; and",
          "authorised safeguarding personnel may access safeguarding information."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should apply role-based access controls so Users do not automatically receive access to information merely because they have a JIT Campus Account."
      },
      {
        "type": "section",
        "num": "25",
        "title": "Service Providers"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may use third-party organisations to support the operation of the Platform."
      },
      {
        "type": "paragraph",
        "text": "These may include providers of:"
      },
      {
        "type": "list",
        "items": [
          "cloud hosting;",
          "communications;",
          "payment processing;",
          "identity verification;",
          "email delivery;",
          "analytics;",
          "cybersecurity;",
          "customer support;",
          "educational technology; and",
          "other infrastructure."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where a provider processes personal information on our behalf, appropriate contractual and security requirements will be implemented."
      },
      {
        "type": "section",
        "num": "26",
        "title": "Educational and Professional Organisations"
      },
      {
        "type": "paragraph",
        "text": "Where necessary for a Service, information may be shared with an educational institution, accreditation body, professional organisation or other relevant organisation."
      },
      {
        "type": "paragraph",
        "text": "This will only occur where there is an appropriate basis and the sharing is necessary for the relevant purpose."
      },
      {
        "type": "section",
        "num": "27",
        "title": "Authorities and Legal Disclosures"
      },
      {
        "type": "paragraph",
        "text": "We may disclose information to courts, regulators, law enforcement agencies or other competent authorities where:"
      },
      {
        "type": "list",
        "items": [
          "required by law;",
          "necessary to comply with a valid legal process;",
          "necessary to protect a person’s safety;",
          "necessary to investigate serious fraud or crime; or",
          "otherwise lawfully permitted."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will not disclose personal information merely because a third party asks for it."
      },
      {
        "type": "section",
        "num": "28",
        "title": "Sale or Reorganisation"
      },
      {
        "type": "paragraph",
        "text": "If Jorsas Tech or JIT Campus undergoes a merger, acquisition, restructuring, investment, sale or transfer of relevant business assets, personal information may be disclosed where reasonably necessary for that process."
      },
      {
        "type": "paragraph",
        "text": "Appropriate confidentiality and data protection safeguards should be applied."
      },
      {
        "type": "part",
        "label": "PART VII",
        "title": "INTERNATIONAL DATA TRANSFERS"
      },
      {
        "type": "section",
        "num": "29",
        "title": "International Processing"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may use technology providers or infrastructure located in different countries."
      },
      {
        "type": "paragraph",
        "text": "As a result, personal information may in some circumstances be processed outside the country in which the User is located."
      },
      {
        "type": "paragraph",
        "text": "Where applicable law restricts international transfers of personal information, JIT Campus will use an appropriate lawful transfer mechanism and safeguards."
      },
      {
        "type": "part",
        "label": "PART VIII",
        "title": "DATA SECURITY"
      },
      {
        "type": "section",
        "num": "30",
        "title": "Protecting Personal Information"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will implement reasonable technical and organisational measures appropriate to the nature and risk of the information processed."
      },
      {
        "type": "paragraph",
        "text": "Measures may include:"
      },
      {
        "type": "list",
        "items": [
          "access controls;",
          "authentication;",
          "encryption where appropriate;",
          "secure communications;",
          "logging;",
          "monitoring;",
          "backup arrangements;",
          "vulnerability management;",
          "security testing;",
          "staff confidentiality requirements;",
          "incident management; and",
          "supplier security controls."
        ]
      },
      {
        "type": "paragraph",
        "text": "No online service can guarantee absolute security. Users also have responsibilities for protecting their Accounts and credentials."
      },
      {
        "type": "section",
        "num": "31",
        "title": "Data Breaches"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will maintain procedures for identifying, assessing, containing and responding to personal data breaches."
      },
      {
        "type": "paragraph",
        "text": "Where a breach creates a legal obligation to notify an affected individual or competent authority, JIT Campus will make the required notification within the applicable timeframe."
      },
      {
        "type": "part",
        "label": "PART IX",
        "title": "DATA RETENTION"
      },
      {
        "type": "section",
        "num": "32",
        "title": "How Long We Keep Information"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will not retain personal information indefinitely merely because storage is available."
      },
      {
        "type": "paragraph",
        "text": "Retention periods will be determined by factors including:"
      },
      {
        "type": "list",
        "items": [
          "the purpose for which information was collected;",
          "academic record requirements;",
          "contractual requirements;",
          "legal obligations;",
          "safeguarding considerations;",
          "dispute and complaint periods;",
          "fraud prevention;",
          "security requirements; and",
          "legitimate business requirements."
        ]
      },
      {
        "type": "paragraph",
        "text": "Different categories of information may therefore have different retention periods."
      },
      {
        "type": "paragraph",
        "text": "When personal information is no longer required, it should be securely deleted, anonymised or otherwise appropriately disposed of."
      },
      {
        "type": "part",
        "label": "PART X",
        "title": "YOUR DATA PROTECTION RIGHTS"
      },
      {
        "type": "section",
        "num": "33",
        "title": "Your Rights"
      },
      {
        "type": "paragraph",
        "text": "Depending on the law applicable to you and the circumstances of the processing, you may have rights concerning your personal information."
      },
      {
        "type": "paragraph",
        "text": "These may include the right to:"
      },
      {
        "type": "list",
        "items": [
          "be informed about processing;",
          "request access to your personal information;",
          "request correction of inaccurate information;",
          "request deletion in certain circumstances;",
          "request restriction of processing;",
          "object to certain processing;",
          "request portability of eligible information;",
          "withdraw consent where processing relies on consent; and",
          "raise concerns about certain automated decisions."
        ]
      },
      {
        "type": "paragraph",
        "text": "These rights are not absolute and may be subject to lawful exemptions."
      },
      {
        "type": "section",
        "num": "34",
        "title": "Access Requests"
      },
      {
        "type": "paragraph",
        "text": "Users may request access to personal information held about them."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may need to verify the identity of the person making the request before disclosing information."
      },
      {
        "type": "paragraph",
        "text": "Information concerning other individuals may need to be protected when responding to a request."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will respond within the period required by applicable law."
      },
      {
        "type": "section",
        "num": "35",
        "title": "Correction of Information"
      },
      {
        "type": "paragraph",
        "text": "Users should keep Account information accurate and current."
      },
      {
        "type": "paragraph",
        "text": "Where information cannot be changed directly through the Account, Users may request correction through the appropriate JIT Campus channel."
      },
      {
        "type": "paragraph",
        "text": "Academic records will not necessarily be changed merely because a Student disagrees with an academic decision. Academic challenges should follow the applicable appeal process."
      },
      {
        "type": "section",
        "num": "36",
        "title": "Deletion Requests"
      },
      {
        "type": "paragraph",
        "text": "Users may request deletion of personal information where applicable."
      },
      {
        "type": "paragraph",
        "text": "Deletion of an Account does not necessarily mean that all information associated with that User can immediately be deleted."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may need to retain certain information for legitimate reasons including:"
      },
      {
        "type": "list",
        "items": [
          "legal obligations;",
          "academic record integrity;",
          "financial recordkeeping;",
          "fraud prevention;",
          "safeguarding;",
          "complaints;",
          "dispute resolution; or",
          "establishment or defence of legal claims."
        ]
      },
      {
        "type": "section",
        "num": "37",
        "title": "Automated Decision-Making"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus uses solely automated processing to make a decision that produces legal or similarly significant effects on an individual, appropriate information and safeguards will be provided where required by applicable law."
      },
      {
        "type": "paragraph",
        "text": "JIT Campus should not use AI or automated tools as an uncontrolled substitute for appropriate human academic or admission decision-making."
      },
      {
        "type": "part",
        "label": "PART XI",
        "title": "CHILDREN AND SAFEGUARDING"
      },
      {
        "type": "section",
        "num": "38",
        "title": "Children’s Personal Information"
      },
      {
        "type": "paragraph",
        "text": "Where JIT Campus provides Services to children or young persons, additional safeguards may apply."
      },
      {
        "type": "paragraph",
        "text": "These may include:"
      },
      {
        "type": "list",
        "items": [
          "age-appropriate privacy information;",
          "appropriate consent mechanisms where legally required;",
          "restricted communication functionality;",
          "enhanced access controls;",
          "safeguarding procedures; and",
          "limitations on profiling or marketing."
        ]
      },
      {
        "type": "paragraph",
        "text": "The best interests and safety of children will be an important consideration when designing Services intended for younger Users."
      },
      {
        "type": "part",
        "label": "PART XII",
        "title": "USER RESPONSIBILITIES"
      },
      {
        "type": "section",
        "num": "39",
        "title": "Protecting Other People’s Information"
      },
      {
        "type": "paragraph",
        "text": "Users may receive access to information about other people through JIT Campus."
      },
      {
        "type": "paragraph",
        "text": "Users must not:"
      },
      {
        "type": "list",
        "items": [
          "access information without authorisation;",
          "disclose confidential information;",
          "download information without legitimate reason;",
          "use Student information for unrelated purposes;",
          "sell personal information;",
          "use information for unauthorised marketing; or",
          "otherwise misuse information obtained through JIT Campus."
        ]
      },
      {
        "type": "paragraph",
        "text": "Lecturers and Admission Marketers have particular responsibilities because their roles may provide access to Student information."
      },
      {
        "type": "part",
        "label": "PART XIII",
        "title": "MARKETING"
      },
      {
        "type": "section",
        "num": "40",
        "title": "Marketing Communications"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus may provide Users with information about Courses, Programmes, events or Services that may be relevant to them."
      },
      {
        "type": "paragraph",
        "text": "Where consent is required for direct marketing, appropriate consent will be obtained."
      },
      {
        "type": "paragraph",
        "text": "Users will be provided with a way to opt out of eligible marketing communications."
      },
      {
        "type": "paragraph",
        "text": "Opting out of marketing does not prevent JIT Campus from sending necessary operational communications such as security alerts, admission decisions, payment notices or Course information."
      },
      {
        "type": "part",
        "label": "PART XIV",
        "title": "CHANGES TO THIS PRIVACY POLICY"
      },
      {
        "type": "section",
        "num": "41",
        "title": "Updates"
      },
      {
        "type": "paragraph",
        "text": "We may update this Privacy Policy to reflect:"
      },
      {
        "type": "list",
        "items": [
          "changes to JIT Campus;",
          "new Services or functionality;",
          "changes to our processing activities;",
          "changes to technology;",
          "changes to legal requirements; or",
          "improvements to our privacy practices."
        ]
      },
      {
        "type": "paragraph",
        "text": "The current version will be published on JIT Campus with the applicable update date."
      },
      {
        "type": "paragraph",
        "text": "Where a change materially affects how personal information is processed, additional notice may be provided where appropriate or legally required."
      },
      {
        "type": "part",
        "label": "PART XV",
        "title": "CONTACT AND COMPLAINTS"
      },
      {
        "type": "section",
        "num": "42",
        "title": "Privacy Contact"
      },
      {
        "type": "paragraph",
        "text": "Questions, concerns or requests relating to personal information should be submitted through the designated JIT Campus privacy contact channel."
      },
      {
        "type": "paragraph",
        "text": "The final published version of this Policy should state:"
      },
      {
        "type": "paragraph",
        "text": "Data Controller/Responsible Organisation: Jorsas Tech"
      },
      {
        "type": "paragraph",
        "text": "Product: JIT Campus"
      },
      {
        "type": "paragraph",
        "text": "Registered Address: [Insert registered address]"
      },
      {
        "type": "paragraph",
        "text": "Privacy Email: [Insert privacy/data protection email]"
      },
      {
        "type": "paragraph",
        "text": "Data Protection Contact/DPO: [Insert where applicable]"
      },
      {
        "type": "section",
        "num": "43",
        "title": "Complaints About Personal Data"
      },
      {
        "type": "paragraph",
        "text": "Individuals are encouraged to contact JIT Campus first where they have concerns about how their personal information has been handled."
      },
      {
        "type": "paragraph",
        "text": "We will seek to investigate privacy complaints fairly and appropriately."
      },
      {
        "type": "paragraph",
        "text": "Where applicable, individuals may also have the right to complain to the competent data protection or privacy regulator in their jurisdiction."
      },
      {
        "type": "paragraph",
        "text": "Making a privacy complaint will not result in a User being penalised for legitimately exercising their data protection rights."
      },
      {
        "type": "section",
        "num": "44",
        "title": "Relationship With Other JIT Campus Policies"
      },
      {
        "type": "paragraph",
        "text": "This Privacy Policy should be read alongside the:"
      },
      {
        "type": "list",
        "items": [
          "JIT Campus Terms and Conditions;",
          "Cookie Policy;",
          "Admissions and Enrolment Policy;",
          "Academic Regulations and Assessment Policy;",
          "Student Code of Conduct;",
          "Lecturer Code of Conduct and Teaching Standards;",
          "Admission Marketer Code of Conduct;",
          "Safeguarding, Equality and Anti-Harassment Policy; and",
          "Complaints, Appeals and Dispute Resolution Policy."
        ]
      },
      {
        "type": "paragraph",
        "text": "Where another policy explains a particular JIT Campus process, this Privacy Policy continues to govern the processing of personal information within that process."
      },
      {
        "type": "section",
        "num": "45",
        "title": "Privacy by Design"
      },
      {
        "type": "paragraph",
        "text": "JIT Campus aims to incorporate privacy and data protection considerations into the design and development of its Services."
      },
      {
        "type": "paragraph",
        "text": "New features that involve significant processing of personal information should be assessed before deployment, including consideration of:"
      },
      {
        "type": "list",
        "items": [
          "what personal information is genuinely required;",
          "why it is required;",
          "who should have access;",
          "how long it should be retained;",
          "whether Users have been appropriately informed;",
          "security requirements;",
          "third-party access;",
          "international transfers;",
          "risks to Students and other Users; and",
          "whether additional safeguards are required."
        ]
      },
      {
        "type": "paragraph",
        "text": "JIT Campus will seek to collect and process only the personal information reasonably necessary for legitimate and defined purposes."
      },
      {
        "type": "copyright",
        "text": "© 2026 Jorsas Tech, JIT Campus. All rights reserved."
      }
    ]
  }
];

// Display order: Terms & Conditions first, then Privacy, then Acceptable Use, then
// every other policy in its original order. Reordered HERE — rather than by
// physically moving the large verbatim blocks above — so the source text stays a
// faithful 1:1 copy of the supplied legal wording. Array.prototype.sort is stable,
// so policies not named in POLICY_ORDER keep their existing relative order.
const POLICY_ORDER = ["terms-and-conditions", "privacy-policy", "acceptable-use"];
const orderRank = (id: string): number => {
  const i = POLICY_ORDER.indexOf(id);
  return i === -1 ? POLICY_ORDER.length : i;
};
export const policies: Policy[] = [...policiesRaw].sort(
  (a, b) => orderRank(a.id) - orderRank(b.id),
);
