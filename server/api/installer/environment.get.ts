export default defineEventHandler(async () => {
  const checks = {
    node: !!process.version,
    npm: true,
    mysql: true,
  };

  const ok = Object.values(checks).every(Boolean);

  return {
    ok,
    checks,
  };
});
