// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_rare_sentinel.sql';
import m0001 from './0001_elite_talkback.sql';
import m0002 from './0002_wide_loki.sql';
import m0003 from './0003_puzzling_ezekiel_stane.sql';
import m0004 from './0004_rename_folders_to_crates.sql';
import m0005 from './0005_lonely_major_mapleleaf.sql';
import m0006 from './0006_glossy_marvel_zombies.sql';
import m0007 from './0007_silky_inertia.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007
    }
  }
  