const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const requestLib = require('request');
const { ipcRenderer } = require('electron');
const SWWIKI_URL = 'https://fishmaple.cn/swc/usr/xx/uploadJson/';
const SWWIKI_URL2 = 'https://fishmaple.cn/swc/usr/xx/uploadJsonensure';

module.exports = {
  defaultConfig: {
    enabled: true,
  },
  pluginName: '魔灵wiki',
  pluginDescription: '自动同步（用户登录时的）游戏数据到【魔灵wiki】小程序（我们不会向他人公开）',
  temp: {},
  init(proxy, config) {
    proxy.on('HubUserLogin', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (!this.checkData(resp)) {
          return proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: MISSING_DATA_ERROR });
        }
        resp = this.sortUserData(resp);

        this.temp[resp.wizard_info.wizard_id] = resp;
       // this.writeProfileToWiki(proxy, resp.wizard_info.wizard_id);
      }
    });
    proxy.on('GuestLogin', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (!this.checkData(resp)) {
          return proxy.log({ type: 'error', source: 'plugin', name: this.pluginName, message: MISSING_DATA_ERROR });
        }
        resp = this.sortUserData(resp);
        
        this.temp[resp.wizard_info.wizard_id] = resp;

        //this.writeProfileToWiki(proxy, resp.wizard_info.wizard_id);
      }
    });
    // will leave this for now for legacy purposes
    proxy.on('getUnitStorageList', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (this.temp[req.wizard_id]) {
          this.temp[req.wizard_id] = { ...this.temp[req.wizard_id], unit_storage_list: resp.unit_storage_list };
          this.writeProfileToWiki(proxy, req.wizard_id);
        }
      }
    });
    proxy.on('GetWizardDataPart1', (req, resp) => {
      if (config.Config.Plugins[this.pluginName].enabled) {
        if (this.temp[req.wizard_id]) {
          this.temp[req.wizard_id] = { ...this.temp[req.wizard_id], unit_storage_list: resp.GetUnitStorageList?.unit_storage_list };
          this.writeProfileToWiki(proxy, req.wizard_id);
          // remove temp so it won't create a new file when opening the shrine again
          this.temp[req.wizard_id];
        }
      }
    });
  },
  writeProfileToWiki(proxy, wizardID) {
    const wizardName = this.temp[wizardID].wizard_info.wizard_name;
    const filename = sanitize(`${wizardName}-${wizardID}`).concat('.json');
    let myid = config.Config.Swwiki.myInfo.myid
    let t = this.temp[wizardID]
    t = this.reloadData(t)
    let payload = {json : t};
    if(myid && config.Config.Swwiki.myInfo.state === '关联中'){
      this.temp[wizardID].filename = filename;
      proxy.log({ type: 'info', source: '魔灵wiki', name: this.pluginName, message: '发起小程序数据同步 <br> 游戏账号id:'.concat(wizardID) });
      requestLib.post(SWWIKI_URL+myid, json=payload, (error, response, body) => {
        if (!error) {
          if (response.statusCode === 200) {
            proxy.log({ type: 'success', source: '魔灵wiki', name: this.pluginName, message: '游戏登录成功，游戏数据已同步至【魔灵wiki】 <br>扫码访问微信小程序查看最新同步的文件<br>'.concat('<img style="text-align:center" src="../assets/qrcode-json.png" />')});
          } else {
            proxy.log({ type: 'error', source: '魔灵wiki', name: this.pluginName, message: '游戏登录成功，游戏数据同步失败，请稍后重试'});
          }
        } else {
          proxy.log({ type: 'error', source: '魔灵wiki', name: this.pluginName, message: `游戏登录成功，游戏数据同步失败，请稍后重试，异常原因：${e}`});
        }
      });
    }else{
      proxy.log({ type: 'error', source: '魔灵wiki', name: this.pluginName, message: '游戏登录成功，游戏数据同步失败，原因：小程序账号未关联或关联失败' });
    }
  },
  reloadData(data){
    data['wizard_skill_info'] = null;
    data['wizard_skill_list'] = null;
    data['quest_active'] = null;
    data['quest_rewarded'] = null;
    data['scenario_list'] = null;
    data['event_id_list'] = null;
    data['deco_list'] = null;
    data['obstacle_list'] = null;
    data['object_storage_list'] = null;
    data['homunculus_skill_list'] = null;
    data['mob_list'] = null;
    data['mob_costume_equip_list'] = null;
    data['mob_costume_part_list'] = null;
    data['summon_special_info'] = null;
    data['island_info'] = null;
    data['shop_info'] = null;
    data['period_item_list'] = null;
    data['notice_info'] = null;
    data['push_noti_status_list'] = null;
    data['unit_depository_slots'] = null;
    data['unit_storage_normal_slots'] = null;
    data['unit_lock_list'] = null;
    data['invite_counter_list'] = null;
    data['deck_recent_list'] = null;
    data['rtpvp_web_link_display'] = null;
    data['rtpvp_season_npc_list'] = null;
    data['shop_bonus_event'] = null;
    data['contents_limit_list'] = null;
    data['quiz_reward_info'] = null;
    data['battle_option_list'] = null;
    data['helper_list'] = null;
    data['mentor_helper_list'] = null;
    data['mentor_slot_list'] = null;
    data['npc_friend_list'] = null;
    data['mentoring_info'] = null;
    data['daily_reward_list'] = null;
    data['daily_reward_info'] = null;
    data['daily_reward_special_pass_info'] = null;
    data['worldboss_status'] = null;
    data['session_key'] = null;
    data['summonerway_event_info'] = null;
    return data;
  },
  checkData(data) {
    // Sometimes com2us doesn't include al lthe required data in the request
    // Most notably is the missing of the building_list object.
    // So lets return false if it's undefined
    if (!data.building_list) {
      return false;
    }
    return true;
  },
  sortUserData(data) {
    // get storage building id
    let storageID;
    for (let building of data.building_list) {
      if (building.building_master_id === 25) {
        storageID = building.building_id;
      }
    }
    // generic sort function
    cmp = function (x, y) {
      return x > y ? 1 : x < y ? -1 : 0;
    };

    // sort monsters
    data.unit_list = data.unit_list.sort((a, b) =>
      cmp(
        [
          cmp(a.building_id === storageID ? 1 : 0, b.building_id === storageID ? 1 : 0),
          -cmp(a.class, b.class),
          -cmp(a.unit_level, b.unit_level),
          cmp(a.attribute, b.attribute),
          cmp(a.unit_id, b.unit_id),
        ],
        [
          cmp(b.building_id === storageID ? 1 : 0, a.building_id === storageID ? 1 : 0),
          -cmp(b.class, a.class),
          -cmp(b.unit_level, a.unit_level),
          cmp(b.attribute, a.attribute),
          cmp(b.unit_id, a.unit_id),
        ]
      )
    );

    // sort runes on monsters
    for (let monster of data.unit_list) {
      // make sure that runes is actually an array (thanks com2us)
      if (monster.runes === Object(monster.runes)) {
        monster.runes = Object.values(monster.runes);
      }

      monster.runes = monster.runes.sort((a, b) => cmp([cmp(a.slot_no, b.slot_no)], [cmp(b.slot_no, a.slot_no)]));
    }

    // make sure that runes is actually an array (thanks again com2us)
    if (data.runes === Object(data.runes)) {
      data.runes = Object.values(data.runes);
    }

    // sort runes in inventory
    data.runes = data.runes.sort((a, b) =>
      cmp([cmp(a.set_id, b.set_id), cmp(a.slot_no, b.slot_no)], [cmp(b.set_id, a.set_id), cmp(b.slot_no, a.slot_no)])
    );

    // sort crafts
    data.rune_craft_item_list = data.rune_craft_item_list.sort((a, b) =>
      cmp(
        [cmp(a.craft_type, b.craft_type), cmp(a.craft_item_id, b.craft_item_id)],
        [cmp(b.craft_type, a.craft_type), cmp(b.craft_item_id, a.craft_item_id)]
      )
    );

    return data;
  },
};
