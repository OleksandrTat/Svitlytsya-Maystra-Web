type CommentItemProps = {
  comment: {
    id: string;
    content: string;
    created_at: string;
    parent_id: string | null;
    author_name: string;
    author_avatar: string | null;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <article
      className={`rounded-2xl border border-[var(--color-border)] bg-white p-4 ${
        comment.parent_id ? "ml-6" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--color-surface)]">
          {comment.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.author_avatar} alt={comment.author_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-[var(--color-text-secondary)]">
              {comment.author_name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{comment.author_name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(comment.created_at)}</p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">{comment.content}</p>
    </article>
  );
}
