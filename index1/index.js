// index1/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      console.log(res);

      this.setData({
        devices:res.devices
      })
      wx.stopBluetoothDevicesDiscovery()

      // res.devices.forEach(device => {
        
      // })
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  search(){ 
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  connect(e){
    console.log(e.currentTarget.dataset.id);
    

    //连接设备
    wx.createBLEConnection({
      deviceId:e.currentTarget.dataset.id, // 搜索到设备的 deviceId
      success: () => {
        console.log('连接成功！');
        // 连接成功，获取服务

        wx.getBLEDeviceServices({
          deviceId:e.currentTarget.dataset.id, // 搜索到设备的 deviceId
          success: (res) => {
            console.log('取得服务：')
            console.log(res);
            for (let i = 0; i < res.services.length; i++) {
              if (res.services[i].isPrimary) {
                // 可根据具体业务需要，选择一个主服务进行通信
                this.sendmsg(e.currentTarget.dataset.id,res.services[i].uuid)
              }
            }
            //this.sendmsg(e.currentTarget.dataset.id,res.services[0].uuid)

          }
        })
       
      }
    })

  },
  sendmsg(deviceId,serviceId){
    wx.getBLEDeviceCharacteristics({
      deviceId, // 搜索到设备的 deviceId
      serviceId, // 上一步中找到的某个服务
      success: (res) => {
        console.log(res);
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.write) { // 该特征值可写
            // 本示例是向蓝牙设备发送一个 0x00 的 16 进制数据
            // 实际使用时，应根据具体设备协议发送数据
            let buffer = new ArrayBuffer(1)
            let dataView = new DataView(buffer)
            dataView.setUint8(0, 0)
            wx.writeBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              value: buffer,
            })
          }
          if (item.properties.read) { // 改特征值可读
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.notify || item.properties.indicate) {
            // 必须先启用 wx.notifyBLECharacteristicValueChange 才能监听到设备 onBLECharacteristicValueChange 事件
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((result) => {
      // 使用完成后在合适的时机断开连接和关闭蓝牙适配器
      wx.closeBLEConnection({
        deviceId,
      })
      wx.closeBluetoothAdapter({})
    })
  }
})