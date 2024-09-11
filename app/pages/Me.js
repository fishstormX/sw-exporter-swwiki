import React from 'react';
import { Image, Button, Confirm, Grid, Header, Form, Icon, Popup, Segment } from 'semantic-ui-react';
const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
let config = remote.getGlobal('config');
class Me extends React.Component {
  constructor() {
    super();
    this.state = {
      myInfo: config.Config.Swwiki.myInfo,
      dialog: false,
    };
  }

  componentDidMount() {
    ipcRenderer.on('updateMyIdOver', () => {
      this.setState({ myInfo: config.Config.Swwiki.myInfo });
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('updateMyIdOver');
  }

  openDialog() {
    this.setState({ dialog: true });
  }

  handleConfirm() {
    config.Config.Swwiki.myInfo = {
      state: '未关联',
      userName: '',
      avatarUrl: '',
      p: '',
      vip: '',
      myid: '',
    };
    this.setState({ myInfo: config.Config.Swwiki.myInfo });
    ipcRenderer.send('myIdUnbindOk');
    this.setState({ dialog: false });
  }

  handleCancel() {
    this.setState({ dialog: false });
  }

  render() {
    return (
      <div>
        <Confirm
          content="确认要解除关联吗，解除关联后您的游戏数据将无法推送至魔灵wiki小程序"
          open={this.state.dialog}
          onCancel={this.handleCancel.bind(this)}
          onConfirm={this.handleConfirm.bind(this)}
        />
        <h1 as="h1">魔灵wiki用户关联状态</h1>
        <p>小程序账号识别状态: {this.state.myInfo.state}</p>
        <p>用户id: {this.state.myInfo.myid}</p>
        <p>用户名: {this.state.myInfo.userName}</p>
        <p className="myAvatar">
          头像:
          <Image className="avatar" src={this.state.myInfo.avatarUrl} />
        </p>
        <p>会员状态: {this.state.myInfo.vip}</p>
        <p>绑定手机: {this.state.myInfo.p}</p>
        <Form>
          <Form.Group widths={2}>
            <Button content="解除关联" icon="refresh" size="small" labelPosition="left" onClick={this.openDialog.bind(this)} />
          </Form.Group>
        </Form>
      </div>
    );
  }
}

module.exports = Me;
