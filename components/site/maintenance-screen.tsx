export function MaintenanceScreen() {
  return (
    <div className="fx-site">
      <main className="fx-frame flex min-h-svh flex-col justify-center gap-3 py-16">
        <h1 className="text-xl font-medium">サイトメンテナンス中</h1>
        <p className="text-sm text-(--fx-muted)">
          バックアップから復元しています。この間はこのページのみ表示されます。復元が終わり次第、自動的に再開します。
        </p>
      </main>
    </div>
  );
}
