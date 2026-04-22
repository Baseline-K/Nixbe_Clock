// pages/device.js
const ecUI = require('../../utils/ecUI.js')
const ecBLE = require('../../utils/ecBLE.js')

let ctx
let isCheckScroll = true
let isCheckRevHex = false
let isCheckSendHex = false
let sendData = ''

Page({
    /**
     * 页面的初始数据
     */
    data: {
        textRevData: '',
        scrollIntoView: 'scroll-view-bottom',
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        ctx = this
        isCheckScroll = true
        isCheckRevHex = false
        isCheckSendHex = false
        sendData = ''
        ecBLE.setChineseType(ecBLE.ECBLEChineseTypeGBK)

        //on disconnect
        ecBLE.onBLEConnectionStateChange(() => {
            ecUI.showModal('提示', '设备断开连接')
        })
        //receive data
        ecBLE.onBLECharacteristicValueChange((str, strHex) => {
            let data =
                ctx.data.textRevData +
                ctx.dateFormat('[hh:mm:ss,S]:', new Date()) +
                (isCheckRevHex ? strHex.replace(/[0-9a-fA-F]{2}/g, ' $&') : str) +
                '\r\n'
            // console.log(data)
            ctx.setData({ textRevData: data })
            if (isCheckScroll) {
                if (ctx.data.scrollIntoView === "scroll-view-bottom") {
                    ctx.setData({ scrollIntoView: "scroll-view-bottom2" })
                } else {
                    ctx.setData({ scrollIntoView: "scroll-view-bottom" })
                }
            }
        })
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        ecBLE.onBLEConnectionStateChange(() => { })
        ecBLE.onBLECharacteristicValueChange(() => { })
        ecBLE.closeBLEConnection()
    },
    checkScroll(e) {
        if (e.detail.value.length) isCheckScroll = true
        else isCheckScroll = false
    },
    checkRevHex(e) {
        if (e.detail.value.length) isCheckRevHex = true
        else isCheckRevHex = false
    },
    checkSendHex(e) {
        if (e.detail.value.length) isCheckSendHex = true
        else isCheckSendHex = false
    },
    inputSendData(e) {
        sendData = e.detail.value
    },
    btClearTap() {
        this.setData({ textRevData: '' })
    },
    btSendTap() {
        if (isCheckSendHex) {
            let data = sendData
                .replace(/\s*/g, '')
                .replace(/\n/g, '')
                .replace(/\r/g, '')
            if (data.length === 0) {
                ecUI.showModal('提示', '请输入要发送的数据')
                return
            }
            if (data.length % 2 != 0) {
                ecUI.showModal('提示', '数据长度只能是双数')
                return
            }
            if (data.length > 488) {
                ecUI.showModal('提示', '最多只能发送244字节')
                return
            }
            if (!new RegExp('^[0-9a-fA-F]*$').test(data)) {
                ecUI.showModal('提示', '数据格式错误，只能是0-9,a-f,A-F')
                return
            }
            ecBLE.writeBLECharacteristicValue(data, true)
        } else {
            if (sendData.length === 0) {
                ecUI.showModal('提示', '请输入要发送的数据')
                return
            }
            let tempSendData = sendData.replace(/\n/g, '\r\n')
            if (tempSendData.length > 244) {
                ecUI.showModal('提示', '最多只能发送244字节')
                return
            }
            ecBLE.writeBLECharacteristicValue(tempSendData, false)
        }
    },
    dateFormat(fmt, date) {
        let o = {
            'M+': date.getMonth() + 1, //月份
            'd+': date.getDate(), //日
            'h+': date.getHours(), //小时
            'm+': date.getMinutes(), //分
            's+': date.getSeconds(), //秒
            'q+': Math.floor((date.getMonth() + 3) / 3), //季度
            S: date.getMilliseconds(), //毫秒
        }
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(
                RegExp.$1,
                (date.getFullYear() + '').substr(4 - RegExp.$1.length)
            )
        for (var k in o)
            if (new RegExp('(' + k + ')').test(fmt)) {
                // console.log(RegExp.$1.length)
                // console.log(o[k])
                fmt = fmt.replace(
                    RegExp.$1,
                    RegExp.$1.length == 1
                        ? (o[k] + '').padStart(3, '0')
                        : ('00' + o[k]).substr(('' + o[k]).length)
                )
            }
        return fmt
    },
    checkChinese(e){
        if(e.detail.value==='gbk'){
            ecBLE.setChineseType(ecBLE.ECBLEChineseTypeGBK)
        }else{
            ecBLE.setChineseType(ecBLE.ECBLEChineseTypeUTF8)
        }
    },
 
    /****************用户自定义函数*******************/
    btSendSwitch1() {    //开启
        let data;
        data = 'AA050001B0'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);  //true传递16进制数据，false传递字符串数据
    },
    btSendSwitch0() {     //关闭
      let data
      data = 'AA050000AF'
      ecBLE.writeBLECharacteristicValue(data, true)  //true传递16进制数据，false传递字符串数据
    },

     

    btSetTime() {     //校准时间
      let yy = new Date().getFullYear()
      let mm = new Date().getMonth()+1<10?'0'+(new Date().getMonth()+1):
      (new Date().getMonth()+1)
      let dd = new Date().getDate()<10?'0'+new Date().getDate():
      new Date().getDate()
      let hh = new Date().getHours()<10?'0'+new Date().getHours():
      new Date().getHours()
      let mf = new Date().getMinutes()<10?'0'+new Date().getMinutes():
      new Date().getMinutes()
      let ss = new Date().getSeconds()<10?'0'+new Date().getSeconds():
      new Date().getSeconds()

      let str = 'AA0B01' + yy + mm + dd + hh + mf + ss 
      let time = 'AA0B01' + yy + mm + dd + hh + mf + ss +  this.check_sum(str) 
      
      if(this.check_data(time) == 0){
        ecBLE.writeBLECharacteristicValue(time, true)
      }
       
    
    },

    //计算校验和函数
    check_sum: function(str) {
      let buffer = new ArrayBuffer(str.length / 2)
      let x = new Uint8Array(buffer)
      //计算校验和
      let sum = 0
      for (let i = 0; i < x.length; i++) {
          x[i] = parseInt(str.substr(2 * i, 2), 16)
          sum += x[i]
      }
      let result = sum & 0xFF//(sum & 0xff) <= 0x0f?'0'+ (sum & 0xff):sum & 0xff
      //转换为Hex 16进制的字符串（想要10进制可以把toString去掉）
      let checksum = result.toString(16).padStart(2, '0')
      return checksum
    },
    /**
     * 计算16进制字符串的校验和
     * @param {string} hexStr - 16进制字符串
     * @returns {string} - 以16进制字符串表示的校验和
     */
    calculateChecksum: function(hexStr) {
      // 确保输入字符串的长度是偶数
      if (hexStr.length % 2 !== 0) {
          console.error('Invalid hex string length.');
          return '';
      }
      let sum = 0;
      // 遍历每两个字符
      for (let i = 0; i < hexStr.length; i += 2) {
          // 提取每个字节的16进制字符串
          const byteStr = hexStr.substring(i, i + 2);
          // 将16进制字符串转换为十进制数
          const byteValue = parseInt(byteStr, 16);
          // 累加到总和
          sum += byteValue;
      }
      // 计算校验和，确保结果在0-255范围内
      const checksum = sum & 0xFF;
      // 将校验和转换为2位的16进制字符串
      return checksum.toString(16).toUpperCase().padStart(2, '0');
    },

    //检查发送数据格式函数
    check_data: function(data)
    {
          if (data.length === 0) {
            ecUI.showModal('提示', '请输入要发送的数据')
            return -1
        }
        if (data.length % 2 != 0) {
            ecUI.showModal('提示', '数据长度只能是双数')
            return -1
        }
        if (data.length > 488) {
            ecUI.showModal('提示', '最多只能发送244字节')
            return -1
        }
        if (!new RegExp('^[0-9a-fA-F]*$').test(data)) {
            ecUI.showModal('提示', '数据格式错误，只能是0-9,a-f,A-F')
            return -1
        }
        return 0
    },

    /**********自定义时间************/
    data_time: {  //页面的初始数据对象
      year: '',
      month: '',
      day: '',
      hour: '',
      minute: '',
      second: '',
      dateTimeString: '',
      show_timeModal: false
    },
    //输入数据时触发的执行函数，将输入数据赋值给对应变量
    inputYear: function (e) {
      this.setData({ year: e.detail.value });
    },
    inputMonth: function (e) {
      this.setData({ month: e.detail.value });
    },
    inputDay: function (e) {
      this.setData({ day: e.detail.value });
    },
    inputHour: function (e) {
      this.setData({ hour: e.detail.value });
    },
    inputMinute: function (e) {
      this.setData({ minute: e.detail.value });
    },
    inputSecond: function (e) {
      this.setData({ second: e.detail.value });
    },
    show_timeModal: function () {
      this.setData({ show_timeModal: true });
    },
    cancel_timeModal: function () {
      this.setData({ show_timeModal: false });
    },

    btChangeTime() {     
        const { year, month, day, hour, minute, second } = this.data;
        // 格式化输入数据
        const formattedYear = year.padStart(4, '0');
        const formattedMonth = month.padStart(2, '0');
        const formattedDay = day.padStart(2, '0');
        const formattedHour = hour.padStart(2, '0');
        const formattedMinute = minute.padStart(2, '0');
        const formattedSecond = second.padStart(2, '0');

        let dateTimeString = 'AA0B01' + formattedYear + formattedMonth + formattedDay + formattedHour + formattedMinute + formattedSecond

        let time = dateTimeString + this.check_sum(dateTimeString)  
    
        if(this.check_data(time) == 0){
          ecBLE.writeBLECharacteristicValue(time, true)
        }
      //关闭弹窗
      this.setData({ show_timeModal: false });
    },


    /*****亮度调节*********/
   
      data_light: {
        show_lightModal: false,
      },

      // 显示模态对话框
      show_lightModal: function() {
        this.setData({
          show_lightModal: true
        });
      },
    
      // 隐藏模态对话框
      cancel_lightModal: function() {
        this.setData({
          show_lightModal: false
        });
      },
    
      // 滑动条变化事件处理函数
      onSliderChange: function(e) {
        const value = e.detail.value;
        let data = 'AA0502' + (value.toString(16)).padStart(2, '0'); //包头、数据个数、指令、指令内容、校验和
        let light = data + this.check_sum(data)
        if(this.check_data(light) == 0){
          ecBLE.writeBLECharacteristicValue(light, true);  //true传递16进制数据，false传递字符串数据
        }
        // console.log("The length of the string is:", light.length,value.toString(16).padStart(2, '0'),this.check_sum(data),this.calculateChecksum(data));
        
        //console.log('Slider value:', value);

      },

      /*****设置功能*********/
      data_setting: {
          showSettingsModal: false,
      },
      //打开弹窗
      openSettings() {
        this.setData({
          showSettingsModal: true
        });
      },
      //关闭弹窗
      closeSettings() {
        this.setData({
          showSettingsModal: false
        });
      },
      // “人体检测”开启和关闭功能
      enableBodyDetection() {
        console.log("人体检测已开启");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050401B4'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);  //true传递16进制数据，false传递字符串数据
      },
      disableBodyDetection() {
        console.log("人体检测已关闭");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050400B3'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);
      },

      // “防阴极中毒”开启和关闭功能
      enableCathodeProtection() {
        console.log("防阴极中毒已开启");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050501B5'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);
      },
      disableCathodeProtection() {
        console.log("防阴极中毒已关闭");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050500B4'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);
      },

      // “光照感应”开启和关闭功能
      enableLightSensing() {
        console.log("光照感应已开启");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050601B6'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);
      },
      disableLightSensing() {
        console.log("光照感应已关闭");
        // 在这里添加具体功能逻辑
        let data;
        data = 'AA050600B5'  //包头、数据个数、指令、指令内容、校验和
        ecBLE.writeBLECharacteristicValue(data, true);
      },

      /*****设置无人检测时间*********/
      data_unmanned_time: {
        showunmannedPopup: false,     // 控制无人检测弹窗显示
        unmannedTime: '',             // 无人检测时间
        maxStaticGates: '',              // 最大静止门数量
        maxDynamicGates: ''              // 最大运动门数量
      },

      // 显示设置无人检测时间弹窗
      showunmannedModal() {
        this.setData({
          showunmannedPopup: true
        });
      },

      // 关闭设置无人检测时间弹窗
      closeunmannedModal() {
        this.setData({
          showunmannedPopup: false
        });
      },

      // 无人检测时间输入处理
      handleunmannedTimeInput(e) {
        this.setData({
          unmannedTime: e.detail.value
        });
      },

      // 最大静止门数量输入处理
      handleMaxStaticGatesInput(e) {
        this.setData({
          maxStaticGates: e.detail.value
        });
      },

      // 最大运动门数量输入处理
      handleMaxDynamicGatesInput(e) {
        this.setData({
          maxDynamicGates: e.detail.value
        });
      },

      // 确定按钮，保存设置并关闭弹窗
      confirm_unmanned_time() {
        const { unmannedTime, maxStaticGates, maxDynamicGates } = this.data;
       

        // 在这里执行保存设置的逻辑
        // 格式化输入数据
        const formattedunmannedTime = unmannedTime.padStart(6, '0');
        const formattedmaxStaticGates = maxStaticGates.padStart(2, '0');
        const formattedmaxDynamicGates = maxDynamicGates.padStart(2, '0');
      

        let unmanned_timeString = 'AA0907' + formattedunmannedTime + formattedmaxStaticGates + formattedmaxDynamicGates

        let unmanned_time = unmanned_timeString + this.check_sum(unmanned_timeString)  
    
        if(this.check_data(unmanned_time) == 0){
          console.log("无人检测时间:", unmannedTime);
          console.log("最大静止门数量:", maxStaticGates);
          console.log("最大运动门数量:", maxDynamicGates);

          ecBLE.writeBLECharacteristicValue(unmanned_time, true)
        }
        // 关闭弹窗
        this.closeunmannedModal();
      }


})
