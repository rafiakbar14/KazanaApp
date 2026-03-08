module.exports = {
    apps: [
        {
            name: "kazana-app",
            script: "dist/index.cjs",
            node_args: "--env-file=.env",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 5000
            }
        }
    ]
};


