import { getMessages } from "@/lib/i18n/server";

const FSMEET_ACCOUNT = "https://fsmeet.com/account";

export async function ProfileGateNotice({
  missing,
  purpose = "vote",
}: {
  missing: string[];
  purpose?: "vote" | "create";
}) {
  const messages = await getMessages();
  const template =
    purpose === "create"
      ? messages.poll.missingProfileCreate
      : messages.poll.missingProfileVote;

  return (
    <div className="card space-y-3 p-5">
      <p className="text-sm text-danger">{template}</p>
      <a
        className="btn btn-secondary"
        href={FSMEET_ACCOUNT}
        target="_blank"
        rel="noreferrer"
      >
        {messages.poll.updateProfile}
      </a>
    </div>
  );
}
