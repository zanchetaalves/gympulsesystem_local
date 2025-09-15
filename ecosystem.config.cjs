module.exports = {
    apps: [{
        name: 'gym-pulse-backend',
        script: 'server/index.js',
        cwd: 'C:\\gym-pulse-system',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '1G',
        error_file: 'C:\\logs\\gym-pulse-error.log',
        out_file: 'C:\\logs\\gym-pulse-out.log',
        log_file: 'C:\\logs\\gym-pulse-combined.log',
        time: true
    }]
};




