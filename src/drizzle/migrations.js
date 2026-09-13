import journal from './meta/_journal.json';
import m0000 from './0000_rare_sentinel.sql';
import m0001 from './0001_elite_talkback.sql';
import m0002 from './0002_wide_loki.sql';
import m0003 from './0003_puzzling_ezekiel_stane.sql';
import m0004 from './0004_rename_folders_to_crates.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004
    }
  }
  