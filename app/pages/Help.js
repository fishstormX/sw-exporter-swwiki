import React from 'react';
import { Image, Accordion, Icon, Table } from 'semantic-ui-react';

class Help extends React.Component {
  constructor() {
    super();
    this.state = { activeIndex: 0 };
  }

  handleAccordionClick(e, titleProps) {
    const { index } = titleProps;
    const newIndex = this.state.activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  }
  render() {
    const { activeIndex } = this.state;

    return (
      <div>
        <h1> 使用说明</h1>
        <p>你的电脑和手机设备需要在同一局域网下（譬如链接相同的Wifi），以确保此代理服务能够抓取到请求数据。</p>
        <p>
          此软件是基于Summoners War Exporter
          基础上添加部分模块开发的软件，用于手机端和Steam端（新增支持）游戏《魔灵召唤：天空之役》，它可以基于代理的工作方式从而获取游戏的数据包，
          使得玩家能导出和查看游戏数据。软件本体的核心逻辑并未改动，@copyright@ SWEX
        </p>
        <p>此版本软件所做的调整：</p>
        <ol>
          <li> 调整默认设置，为仅进行游戏数据导出的萌新使用更友好 </li>
          <li> 汉化软件关键功能 </li>
          <li> 添加对魔灵wiki小程序的支持 </li>
          <li> 优化部分数据传输逻辑，脱敏一些关键字段，保障数据安全 </li>
        </ol>
        <h3>【前置步骤】获取安装证书</h3>
        <p>游戏接口使用安全的SSL协议，需要加载和配置证书才能保证代理能够正常使用，这是使用代理的前置动作。</p>
        <ol>
          <li>点击软件右上角 "启动代理"</li>
          <li>点击软件右上角 "获取证书"</li>
          <li>将会在软件工作路径下（默认是桌面下的“Summoners War Exporter Files”文件夹下） 的“cert”文件夹下生成"ca.pem" 。</li>
          <li>证书将会在至少1年内不会失效</li>
        </ol>

        <h2>使用说明/教程</h2>
        <Accordion>
          <Accordion.Title active={activeIndex === 201} index={201} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            方法一：使用steam魔灵召唤
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 201}>
            <p className="red top">注意：该方式在开启/关闭代理时会修改您的hosts文件，虽然只是是在原有文件添加几行，但我们仍建议初次使用前进行备份</p>
            <p className="p">1.启动本软件</p>
            <p className="p">
              2.第一次使用请点击右上角的安装证书(仅首次)，无需填写或修改任何内容，按提示重复点击下一步操作，直到弹出证书安装成功。后续此步骤可略过。
            </p>
            <p className="p">
              3.如果要同步游戏数据至魔灵wiki，需要在左上角小程序用户id处填写您的用户id，并点击关联，直到如下图看到关联成功的提示。（同时在魔灵wiki菜单也可看到您的小程序用户信息）。
            </p>
            <Image className="p" src="../assets/relateSuccess.png" bordered />
            <p className="p">4.打开steam的魔灵召唤进入游戏即可，登录后数据便会同步至小程序（可能存在数分钟的数据处理延迟）</p>
            <p className="p">5.如果是首次登录账号，请检查小程序内数据，可能需要重复4步骤一次方能同步成功</p>
            <p className="p bottom">
              ps：启动和关闭软件/游戏会提示向您索要管理权限，这是代理设置hosts的必须环节，不会对您的设备带来任何问题，点击确认即可。
            </p>
          </Accordion.Content>
          <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            方法二：使用Mumu模拟器
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 2}>
            <ol>
              <li> 通过上面的步骤获取证书 </li>
              <li> 打开Mumu共享文件目录</li>
              <li> 将生成好的证书文件拷贝到共享目录中</li>
              <li> 跳转到: 设置 → 安全 → 从SD卡安装 → $MuMuSharedFolder</li>
              <li>
                选中证书文件(文件名 ca.pem), 随意命名，选择 use to VPN & apps. 点击确认.
                <ul>
                  <li>If the cert file is greyed out for some reason try to rename the extension from .pem to .cer</li>
                </ul>
              </li>
              <li> 启动本代理服务</li>
              <li> 跳转到Mumu模拟器的: 设置 → WiFi</li>
              <li> 长按当前的网络 → 点击编辑网络</li>
              <li> 修改“代理”为“手动”</li>
              <li> IP和端口填写此软件左上角的IP和端口</li>
              <li> 点击保存</li>
              <li> In SWEX: confirm HTTPS is turned on</li>
              <li> 开启代理</li>
            </ol>
          </Accordion.Content>
          <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            相关文档 & 软件下载
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 1}>
            <ul>
              <li>
                <a href="https://store.steampowered.com/app/2426960/_/" target="_blank">
                  Steam版本魔灵召唤[大陆节点]
                </a>
              </li>
              <li>
                <a href="https://mumu.163.com/" target="_blank">
                  Mumu模拟器官网[大陆节点]
                </a>
              </li>
              <li>
                <a href="https://mumu.163.com/update/other/" target="_blank">
                  Mumu模拟器Mac下载地址[大陆节点]
                </a>
              </li>
              <li>
                <a href="https://www.withhive.com/games/313" target="_blank">
                  魔灵召唤：天空之役 国内官网[大陆节点]
                </a>
              </li>
              <li>软件教程更新ing</li>
            </ul>
          </Accordion.Content>
        </Accordion>

        <p>启动游戏，你可以在运行日志页面看到相关信息</p>
        <Image src="../assets/help_success.png" bordered />
        <p>恭喜你，成功了!</p>

        <h1>快捷键</h1>
        <Table celled inverted selectable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan="2">快捷键/平台</Table.HeaderCell>
              <Table.HeaderCell rowSpan="2">描述</Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell>Windows / Linux</Table.HeaderCell>
              <Table.HeaderCell>MacOS</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Ctrl + S</Table.Cell>
              <Table.Cell>Command + S</Table.Cell>
              <Table.Cell>Toggle proxy service.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Ctrl + B</Table.Cell>
              <Table.Cell>Command + B</Table.Cell>
              <Table.Cell>Toggle compact mode.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 1（非小键盘）</Table.Cell>
              <Table.Cell>Command + 1</Table.Cell>
              <Table.Cell>Navigate to Logs view.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 2（非小键盘）</Table.Cell>
              <Table.Cell>Command + 2</Table.Cell>
              <Table.Cell>Navigate to Settings view.</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Alt + 3（非小键盘）</Table.Cell>
              <Table.Cell>Command + 3</Table.Cell>
              <Table.Cell>Navigate to Help view.</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <h1>FAQ</h1>
        <Accordion>
          <Accordion.Title active={activeIndex === 802} index={802} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            此软件有哪些功能？
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 802}>
            软件来源于https://github.com/Xzandro/sw-exporter，魔灵wiki在原软件基础上添加了部分汉化和上传数据的能力。其他原有功能可以继续使用，我们做出的调整有：
            <ol>
              <li> 调整默认设置，为仅进行游戏数据导出的萌新使用更友好 </li>
              <li> 汉化软件关键功能 </li>
              <li> 添加对魔灵wiki小程序的支持 </li>
              <li> 优化部分数据传输逻辑，脱敏一些关键字段，保障数据安全 </li>
            </ol>
            更多功能还在路上，敬请期待
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 96} index={96} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            使用此软件是否有封号/限制使用风险?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 96}>
            此软件会开启你的设备和游戏服务器之间的代理，代理行为在网络应用中是非常常见的，数以万计的玩家在使用SWExporter，尚且无证据表明游戏官方会检测到和管控此行为。
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 801} index={801} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            为什么我无法启动代理/弹窗报错/启动后无法登录游戏？
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 801}>
            Steam版本：一般可能是本地端口被占用，您可以查看您的机器443端口（无法修改，这是协议必要的）的占用情况，一般开启其他代理软件/虚拟机等有较大可能占用，需要关闭其他软件后才能使用此代理。
            如果报错hosts文件相关/启动代理成功但无法登陆，您可以查看您的hosts文件配置中是否有xxxxx.qpyou.cn几行配置，如果没有，请以管理员权限重新打开本软件重试。
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 97} index={97} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What about SWProxy?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 97}>
            SWProxy suffered from a few issues - difficulty releasing on mac and linux, proxy causing broken event pages, etc. SW Exporter was
            developed on a new code platform trying to address these issues from the start.
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 98} index={98} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            What if I find an issue?
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 98}>
            Please{' '}
            <a href="https://github.com/Xzandro/sw-exporter" target="_blank">
              report it on Github <Icon name="github square" />
            </a>
            .
          </Accordion.Content>

          <Accordion.Title active={activeIndex === 99} index={99} onClick={this.handleAccordionClick.bind(this)}>
            <Icon name="dropdown" />
            软件声明
          </Accordion.Title>
          <Accordion.Content active={activeIndex === 99}>
            <p>
              项目fork自 
              <a href="https://github.com/Xzandro/sw-exporter" target="_blank">
                report it on Github <Icon name="github square" />
              </a>
            </p>
          </Accordion.Content>
        </Accordion>
      </div>
    );
  }
}

module.exports = Help;
