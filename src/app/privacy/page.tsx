export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="display text-4xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-text-muted">
        Provisional draft — refine later before relying on it as final legal text.
      </p>
      <div className="card space-y-4 p-6 leading-relaxed text-text-muted whitespace-pre-line text-sm">
        {`PRIVACY POLICY (PROVISIONAL)
Voice — community governance for freestyle football (part of FSMeet)

Controller
Nils Effinghausen (sole proprietor)
Lierstraße 20
80639 Munich
Email: nils.effinghausen@gmail.com

What Voice is
Voice is a web application for community polls, discussion, and voting. Account login and core profile data are provided by FSMeet; Voice stores governance activity (polls, ballots, comments, rankings).

Data we process
1) Account & identity (via FSMeet OAuth / FSMeet user APIs): identifiers, profile picture, name, user type, and demographics used for filters/charts when present (age, gender, country/region).
2) Governance activity stored by Voice (MySQL): polls, ballots (including abstentions), comments (soft-deleted rows retained), up/down scores.
3) Technical data needed to operate and protect the service.

Purposes
Provide authentication and identity display; enforce eligibility; run polls, voting, My votes, comments, ranking; operate and secure the service.

FSMeet
Sign-in and profile data come from FSMeet. Update account details at https://fsmeet.com/account.

Sharing
We do not sell personal data. Hosting providers may process data to run Voice. Public community content is visible according to product rules.

Your rights
Depending on applicable law you may have access, rectification, erasure, restriction, objection, and portability rights. Contact the controller above.

Contact
nils.effinghausen@gmail.com`}
      </div>
    </article>
  );
}
