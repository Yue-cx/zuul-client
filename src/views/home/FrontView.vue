<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import router from '@/router/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from "axios";

// 响应式状态
const player = reactive({
  name: '冒险者',
  inventory: []
})

const rooms = reactive([
  {
    id: 1,
    name: '大厅',
    description: '这是一个宽敞的大厅，四周墙壁上挂着古老的油画。',
    image: 'https://placeholder.pics/svg/400x300/DEDEDE/555555/大厅',
    exits: {
      north: 2,
      east: 3
    },
    items: [
      {
        id: 3,
        name: '宝剑',
        description: '一把锋利的宝剑',
        weight: 2,
        isUsable: true
      },
      {
        id: 4,
        name: '药水',
        description: '红色的治疗药水',
        weight: 1,
        isUsable: true
      }
    ]
  }
])

const currentRoomId = ref(1)
const history = ref([])
const selectedRoomItem = ref(null)
const selectedInventoryItem = ref(null)
const helpVisible = ref(false)
const maxInventoryWeight = ref(10)

// 计算属性
const currentRoom = computed(() =>
    rooms.find(room => room.id === currentRoomId.value) || rooms[0]
)

const canGoBack = computed(() => history.value.length > 0)

const inventoryCapacity = computed(() => {
  const currentWeight = player.inventory.reduce((sum, item) => sum + item.weight, 0)
  return `${currentWeight.toFixed(1)} / ${maxInventoryWeight.value}`
})

// 生命周期
onMounted(() => {
  loadUserData()
  loadUserInventory()
  loadUserRoom()
})




// 方法

//获取用户数据
const loadUserData = () => {
  const storedUser = sessionStorage.getItem('user')
  if (storedUser) {
    const userData = JSON.parse(storedUser)
    Object.assign(player, {
      name: userData.name || '冒险者'
    })
  }
}

//获取用户物品
const loadUserInventory = async () => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'))

    const response = await axios.get(`/api/condition/bag/${user.id}`)
    if (response.status === 200) {
      console.log("获取物品成功:", response.data)
      const inventoryData = response.data
      player.inventory = inventoryData.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        weight: item.weight
      }))
    } else {
      ElMessage.error('获取物品失败')
    }
  } catch (error) {
    console.error('获取物品失败:', error)
    ElMessage.error('获取物品失败')
  }
}

//获取用户关联的房间信息
const loadUserRoom = async () => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user'))
    const response = await axios.get(`/api/room/user/${user.id}`)

    if (response.status === 200) {
      // 清空原始数组（保持响应性）
      rooms.splice(0, rooms.length)

      // 转换并填充新数据
      response.data.forEach(apiRoom => {
        rooms.push({
          id: apiRoom.id,
          name: apiRoom.name,
          description: apiRoom.description,
          image: apiRoom.image || `https://placeholder.pics/svg/400x300/DEDEDE/555555/${apiRoom.name}`,
          exits: apiRoom.exits || {},
          items: apiRoom.items ? apiRoom.items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            weight: item.weight,
            isUsable: item.isUsable
          })) : []
        })
      })
      console.log("获取房间成功", rooms)

      // 更新当前房间（假设API返回当前房间）
      if (response.data.currentRoomId) {
        currentRoomId.value = response.data.currentRoomId
      }
    } else {
      ElMessage.error('获取房间失败')
    }
  } catch (error) {
    console.error('获取房间失败:', error)
    ElMessage.error('获取房间失败')
  }
}


const save = async() => {
  const user = JSON.parse(sessionStorage.getItem('user'))
  try {
    const response1 = await axios.post(
        "/api/condition/save/backpack",
        {
          userId: user.id,
          inventory: player.inventory
        }
    )
    const response2 = await axios.post(
        "/api/condition/save/rooms",
        {
          userId: user.id,
          rooms: rooms.map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            items: room.items
          }))
        }
    )

    if (response1.status === 200 && response2.status === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }

}




const move = (direction) => {
  const nextRoomId = currentRoom.value.exits[direction]
  if (nextRoomId) {
    history.value.push(currentRoomId.value)
    currentRoomId.value = nextRoomId
    selectedRoomItem.value = null
  }
}

const goBack = () => {
  if (history.value.length > 0) {
    currentRoomId.value = history.value.pop()
    selectedRoomItem.value = null
  }
}

const selectRoomItem = (item) => {
  selectedRoomItem.value = item
  selectedInventoryItem.value = null
}

const selectInventoryItem = (item) => {
  selectedInventoryItem.value = item
  selectedRoomItem.value = null
}

const pickItem = () => {
  if (!selectedRoomItem.value) return

  const currentWeight = player.inventory.reduce(
      (sum, item) => sum + item.weight,
      0
  )

  if (currentWeight + selectedRoomItem.value.weight > maxInventoryWeight.value) {
    ElMessage.error('背包已满，无法拾取更多物品')
    return
  }

  const roomItemIndex = currentRoom.value.items.findIndex(
      item => item.id === selectedRoomItem.value.id
  )

  if (roomItemIndex !== -1) {
    const [item] = currentRoom.value.items.splice(roomItemIndex, 1)
    player.inventory.push(item)
    ElMessage.success(`已拾取: ${item.name}`)
    selectedRoomItem.value = null
  }
}

const dropItem = () => {
  if (!selectedInventoryItem.value) return

  const inventoryIndex = player.inventory.findIndex(
      item => item.id === selectedInventoryItem.value.id
  )

  if (inventoryIndex !== -1) {
    const [item] = player.inventory.splice(inventoryIndex, 1)
    currentRoom.value.items.push(item)
    ElMessage.success(`已丢弃: ${item.name}`)
    selectedInventoryItem.value = null
  }
}

const useItem = () => {
  if (!selectedInventoryItem.value) return
  ElMessage.success(`使用了: ${selectedInventoryItem.value.name}`)
  selectedInventoryItem.value = null
}

const showHelp = () => {
  helpVisible.value = true
}

const logout = () => {
  ElMessageBox.confirm('确定要退出游戏吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('已退出游戏')
    router.push("/auth/login")
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}
</script>

<template>
  <div class="zuul-game-container">
    <!-- 顶部标题栏 -->
    <div class="header">
      <h1 class="game-title">ZUUL 文字冒险游戏</h1>
      <div class="player-info">
        <span>玩家: {{ player.name }}</span>
        <el-button type="danger" size="small" @click="logout" class="logout-btn">退出</el-button>
      </div>
    </div>

    <!-- 主游戏区域 -->
    <div class="main-content">
      <!-- 左侧游戏主体区 -->
      <div class="game-area">
        <div class="navigation-controls">
          <el-button type="primary" @click="goBack" :disabled="!canGoBack">回退</el-button>
        </div>

        <!-- 当前房间展示 -->
        <div class="room-display">
          <div class="room-image-container">
            <img :src="currentRoom.image" :alt="currentRoom.name" class="room-image">

            <!-- 方向门控制 -->
            <div class="door-controls">
              <el-button
                  v-if="currentRoom.exits.north"
                  class="door north"
                  @click="move('north')"
                  type="primary"
              >北
              </el-button>

              <el-button
                  v-if="currentRoom.exits.east"
                  class="door east"
                  @click="move('east')"
                  type="primary"
              >东
              </el-button>

              <el-button
                  v-if="currentRoom.exits.south"
                  class="door south"
                  @click="move('south')"
                  type="primary"
              >南
              </el-button>

              <el-button
                  v-if="currentRoom.exits.west"
                  class="door west"
                  @click="move('west')"
                  type="primary"
              >西
              </el-button>
            </div>
          </div>

          <div class="room-description">
            <h3>{{ currentRoom.name }}</h3>
            <p>{{ currentRoom.description }}</p>
          </div>
        </div>

        <el-button
            class="help-btn"
            type="info"
            @click="showHelp"
        >帮助
        </el-button>
      </div>

      <!-- 右侧物品栏 -->
      <div class="inventory-area">
        <!-- 房间物品 -->
        <div class="item-table">
          <h3>房间物品</h3>
          <el-table
              :data="currentRoom.items"
              height="250"
              border
              style="width: 100%"
              @row-click="selectRoomItem"
          >
            <el-table-column prop="name" label="名称" width="120"></el-table-column>
            <el-table-column prop="description" label="描述"></el-table-column>
            <el-table-column prop="weight" label="重量" width="80"></el-table-column>
          </el-table>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button-group>
            <el-button
                type="success"
                @click="pickItem"
                :disabled="!selectedRoomItem"
            >拾取
            </el-button>
            <el-button
                type="warning"
                @click="dropItem"
                :disabled="!selectedInventoryItem"
            >丢弃
            </el-button>
            <el-button
                type="primary"
                @click="useItem"
                :disabled="!selectedInventoryItem"
            >使用
            </el-button>
          </el-button-group>

          <el-button
            type="primary"
            @click="save"
          >保存
          </el-button>
        </div>

        <!-- 玩家背包 -->
        <div class="item-table">
          <h3>玩家背包 (容量: {{ inventoryCapacity }})</h3>
          <el-table
              :data="player.inventory"
              height="250"
              border
              style="width: 100%"
              @row-click="selectInventoryItem"
          >
            <el-table-column prop="name" label="名称" width="120"></el-table-column>
            <el-table-column prop="description" label="描述"></el-table-column>
            <el-table-column prop="weight" label="重量" width="80"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <el-dialog title="游戏帮助" v-model="helpVisible" width="50%">
      <div class="help-content">
        <h3>ZUUL 游戏操作指南</h3>
        <p>1. 点击方向按钮(北、东、南、西)可以移动到相邻房间</p>
        <p>2. 点击"返回"按钮可以回到上一个房间</p>
        <p>3. 从"房间物品"列表中选择物品，点击"拾取"可以将其放入背包</p>
        <p>4. 从"玩家背包"列表中选择物品，点击"使用"可以使用物品</p>
        <p>5. 从"玩家背包"列表中选择物品，点击"丢弃"可以将物品放回房间</p>
        <p>6. 背包有容量限制，不能携带过多物品</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="helpVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 保持原有样式不变 */
.zuul-game-container {
  width: 1650px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #2c3e50;
  color: white;
}

.game-title {
  margin: 0;
  font-size: 24px;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  margin-left: 10px;
}

.main-content {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.game-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  position: relative;
}

.navigation-controls {
  margin-bottom: 10px;
}

.room-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.room-image-container {
  position: relative;
  height: 600px;
}

.room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.door-controls {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.door {
  position: absolute;
  min-width: 80px;
}

.door.north {
  top: 10px;
}

.door.east {
  right: 10px;
}

.door.south {
  bottom: 10px;
}

.door.west {
  left: 10px;
}

.room-description {
  padding: 15px;
}

.help-btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
}

.inventory-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 50px;
}

.item-table {
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.item-table h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.help-content {
  line-height: 1.8;
}
</style>