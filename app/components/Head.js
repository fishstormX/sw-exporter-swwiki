import React from 'react';

import {
  Divider,
  Grid,
  GridColumn,
  GridRow,
  Header,
  Icon,
  Menu,
  Modal,
  ModalContent,
  ModalHeader,
  Button,
  Input,
  Segment,
  Select,
} from 'semantic-ui-react';

const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const requestLib = require('request');
const SWWIKI_URL = 'https://fishmaple.cn/swc/usr/xx/AEE4CC7605A4/';
let request = requestLib.defaults({ baseUrl: SWWIKI_URL });
let config = remote.getGlobal('config');

class Head extends React.Component {
  constructor() {
    super();
    this.state = { proxyRunning: ipcRenderer.sendSync('proxyIsRunning'), modal: false };

    Mousetrap.bind(['command+s', 'ctrl+s'], () => {
      this.toggleProxy();
    });
  }

  changeMyId(e) {
    config.Config.Swwiki.myid = e.target.value;
  }

  changeMyId2(e) {
    let myid = config.Config.Swwiki.myid;
    config.Config.Swwiki.myRealId = myid;
    request.get(myid, (error, response, body) => {
      if (!error) {
        if (response.statusCode === 200) {
          let acceptedLogCommands = JSON.parse(body);
          if (acceptedLogCommands.code === 0) {
            let myInfo = acceptedLogCommands.data;
            config.Config.Swwiki.myInfo = {
              state: '关联中',
              userName: myInfo.userName,
              avatarUrl: myInfo.avatarUrl,
              p: myInfo.p,
              vip: myInfo.vip,
              myid: myid,
            };
            ipcRenderer.send('myIdOk');
          } else {
            config.Config.Swwiki.myInfo = { state: '尚未关联', userName: '-', avatarUrl: '-', p: '-', vip: '-', myid: '尚未关联' };
            ipcRenderer.send('myIdBad');
          }
          ipcRenderer.send('updateMyIdOverMain');
        } else {
          ipcRenderer.send('myIdBad');
        }
      } else {
        ipcRenderer.send('myIdBad');
      }
    });
  }

  componentDidMount() {
    ipcRenderer.on('proxyStarted', () => {
      this.setState({ proxyRunning: true });
    });

    ipcRenderer.on('proxyStopped', () => {
      this.setState({ proxyRunning: false });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('proxyStarted');
    ipcRenderer.removeAllListeners('proxyStopped');
  }

  toggleProxy() {
    if (ipcRenderer.sendSync('proxyIsRunning')) {
      ipcRenderer.send('proxyStop');
    } else {
      ipcRenderer.send('proxyStart');
    }
  }

  startProxy(state) {
    ipcRenderer.send('proxyStart', state);
    this.setState({ modal: false });
  }

  getCert() {
    ipcRenderer.send('getCert');
  }

  getAndInstallCertSteam() {
    ipcRenderer.send('getAndInstallCertSteam');
  }

  changePort(e) {
    const port = Number(e.target.value);
    config.Config.Proxy.port = port;
    ipcRenderer.send('updateConfig');
  }

  isSteamMode() {
    return this.isWindows() && config.Config.Proxy.steamMode;
  }

  isWindows() {
    return remote.process.platform === 'win32';
  }

  changeSteamMode(state) {
    ipcRenderer.send('changeSteamMode', state);
  }

  modalSetOpen(state) {
    this.setState({ modal: state });
  }

  render() {
    const interfaces = ipcRenderer.sendSync('proxyGetInterfaces').map((interfaceEntry, i) => ({ key: i, text: interfaceEntry, value: i }));
    return (
      <Menu className="main-menu" fixed="top">
        {!this.isSteamMode() && (
          <Menu.Item>
            <Select label="Interfaces" options={interfaces} defaultValue={0} />
          </Menu.Item>
        )}
        <Menu.Item>
          <Input label="端口" defaultValue={config.Config.Proxy.port} onChange={this.changePort.bind(this)} />
        </Menu.Item>
        <Menu.Item>
          <Input
            className="normalInput2"
            label="小程序用户id"
            action={<Button content="关联" onClick={this.changeMyId2.bind(this)} />}
            defaultValue={config.Config.Swwiki.myid}
            onChange={this.changeMyId.bind(this)}
          />
        </Menu.Item>
        <Menu.Item position="right">
          {this.isSteamMode() && (
            <Button content="安装证书 (Steam)(仅首次)" icon="share" labelPosition="right" onClick={this.getAndInstallCertSteam.bind(this)} />
          )}
          <Button content="获取证书" icon="share" labelPosition="right" onClick={this.getCert.bind(this)} />

          {this.state.proxyRunning ? (
            <Button content="关闭代理" icon="stop" labelPosition="right" onClick={this.toggleProxy.bind(this)} />
          ) : this.isWindows() ? (
            <Modal
              onClose={() => this.modalSetOpen(false)}
              onOpen={() => this.modalSetOpen(true)}
              open={this.state.modal}
              size="small"
              trigger={<Button content="启动代理" icon="play" labelPosition="right" />}
            >
              <ModalHeader>选择模式</ModalHeader>
              <ModalContent>
                <Segment placeholder>
                  <Grid columns={2} stackable textAlign="center">
                    <Divider vertical></Divider>

                    <GridRow verticalAlign="middle">
                      <GridColumn>
                        <Header icon>
                          <Icon name="game" />
                          Steam模式
                        </Header>
                        <p>建议使用的方式，因为您无需手动配置代理和导入证书</p>
                        <Button primary onClick={() => this.startProxy(true)}>
                          启动
                        </Button>
                      </GridColumn>

                      <GridColumn>
                        <Header icon>
                          <Icon name="world" />
                          远程代理模式
                        </Header>
                        <p>区别于Steam模式，用于移动端代理或是模拟器等</p>
                        <Button primary onClick={() => this.startProxy(false)}>
                          启动
                        </Button>
                      </GridColumn>
                    </GridRow>
                    <GridRow verticalAlign="middle">
                      <GridColumn></GridColumn>
                    </GridRow>
                  </Grid>
                </Segment>
              </ModalContent>
            </Modal>
          ) : (
            <Button content="Start Proxy" icon="play" labelPosition="right" onClick={() => this.startProxy(false)} />
          )}
        </Menu.Item>
      </Menu>
    );
  }
}

module.exports = Head;
