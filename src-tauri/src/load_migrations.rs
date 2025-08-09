use tauri_plugin_sql::{Migration, MigrationKind};

pub fn load_migrations() -> Vec<Migration> {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "init",
            sql: include_str!("../migrations/0000_little_red_skull.sql"),
            kind: MigrationKind::Up,
        },
    ];

    return migrations;
}
