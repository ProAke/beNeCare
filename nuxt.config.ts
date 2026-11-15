export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss"],

  css: ["@/assets/css/main.css"],

  runtimeConfig: {
    app: {
      name: "beNeCare",
      version: "1.0.0",
    },
    database: {
      host: "localhost",
      port: 3306,
      name: "benecare",
      user: "root",
      password: "",
    },
    line: {
      channelId: "",
      channelSecret: "",
      channelAccessToken: "",
    },
    installPin: "524452",
    public: {
      appName: "beNeCare",
      apiBase: "",
    },
  },

  nitro: {
    devProxy: {},
  },
});
