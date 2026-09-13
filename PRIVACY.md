# Privacy

Social Media Engine has no built-in telemetry, central account, or automatic upload.
The local runtime stores brand answers, assets, content, reviews, feedback, metrics and
audit records in the user's selected working folder. Data is not encrypted by this
plugin. Protect the device, filesystem permissions and backups.

The dashboard listens on loopback only. Its random token is a local session capability,
not a multi-user authentication system. Keep its URL private. Stop the server when done.

The AI host and any deliberately used external providers have their own data policies.
Authorized creative tools may receive brand references/prompts; an authorized Postiz
send uploads selected assets and captions. Reading accounts/posts also contacts Postiz.
Environment credentials are not written into the brand database. Do not enter secrets
in brand answers or feedback; automated detection is limited, not a secret-scanner guarantee.

To remove local data, stop all plugin processes and delete the chosen workspace's
`.social-media-engine/` after backing up anything needed. This does not delete provider
uploads, scheduled/public posts, host chat history, or external service records.
Use those services' controls separately.

Privacy questions: mohammedj@aurendor.io.
