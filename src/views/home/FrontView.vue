<template>
  <div class="zuul-game-container">
    <!-- 顶部标题栏 -->
    <div class="header">
      <h1 class="game-title">ZUUL 文字冒险游戏</h1>
      <div class="player-info">
        <span>玩家: {{ player.name }}</span>
        <span>生命值: {{ player.health }}</span>
        <span>分数: {{ player.score }}</span>
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

<script>
import router from "@/router/index.js";

export default {
  name: 'ZuulGame',
  data () {
    return {
      player: {
        name: '冒险者',
        health: 100,
        score: 0,
        inventory: [
          {
            id: 1,
            name: '钥匙',
            description: '一把生锈的钥匙',
            weight: 0.5
          },
          {
            id: 2,
            name: '手电筒',
            description: '电量不足的手电筒',
            weight: 1
          }
        ]
      },
      rooms: [
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
              weight: 2
            },
            {
              id: 4,
              name: '药水',
              description: '红色的治疗药水',
              weight: 0.3
            }
          ]
        },
        {
          id: 2,
          name: '书房',
          description: '摆满古籍的书房，空气中弥漫着纸张和墨水的气味。',
          image: 'https://placeholder.pics/svg/400x300/DEDEDE/555555/书房',
          exits: {
            south: 1,
            west: 4
          },
          items: [
            {
              id: 5,
              name: '古书',
              description: '一本写满奇怪符号的古书',
              weight: 1.5
            }
          ]
        },
        {
          id: 3,
          name: '厨房',
          description: '一个破旧的厨房，灶台上积满了灰尘。',
          image: 'https://placeholder.pics/svg/400x300/DEDEDE/555555/厨房',
          exits: {
            west: 1,
            north: 5
          },
          items: [
            {
              id: 6,
              name: '面包',
              description: '一块发霉的面包',
              weight: 0.2
            }
          ]
        },
        {
          id: 4,
          name: '卧室',
          description: '一张大床占据了房间的大部分空间，床单看起来很久没换了。',
          image: 'https://placeholder.pics/svg/400x300/DEDEDE/555555/卧室',
          exits: { east: 2 },
          items: []
        },
        {
          id: 5,
          name: '花园',
          description: '一个荒废的花园，杂草丛生，但仍有几朵花顽强地开放着。',
          image: 'https://placeholder.pics/svg/400x300/DEDEDE/555555/花园',
          exits: { south: 3 },
          items: [
            {
              id: 7,
              name: '铲子',
              description: '园艺铲子',
              weight: 1.8
            }
          ]
        }
      ],
      currentRoomId: 1,
      history: [],
      selectedRoomItem: null,
      selectedInventoryItem: null,
      helpVisible: false,
      maxInventoryWeight: 10
    }
  },
  computed: {
    currentRoom () {
      return this.rooms.find(room => room.id === this.currentRoomId) || this.rooms[0]
    },
    canGoBack () {
      return this.history.length > 0
    },
    inventoryCapacity () {
      const currentWeight = this.player.inventory.reduce((sum, item) => sum + item.weight, 0)
      return `${currentWeight.toFixed(1)} / ${this.maxInventoryWeight}`
    }
  },
  methods: {
    move (direction) {
      const nextRoomId = this.currentRoom.exits[direction]
      if (nextRoomId) {
        this.history.push(this.currentRoomId)
        this.currentRoomId = nextRoomId
        this.selectedRoomItem = null
      }
    },
    goBack () {
      if (this.history.length > 0) {
        this.currentRoomId = this.history.pop()
        this.selectedRoomItem = null
      }
    },
    selectRoomItem (item) {
      this.selectedRoomItem = item
      this.selectedInventoryItem = null
    },
    selectInventoryItem (item) {
      this.selectedInventoryItem = item
      this.selectedRoomItem = null
    },
    pickItem () {
      if (!this.selectedRoomItem) return

      // 检查背包容量
      const currentWeight = this.player.inventory.reduce((sum, item) => sum + item.weight, 0)
      if (currentWeight + this.selectedRoomItem.weight > this.maxInventoryWeight) {
        this.$message.error('背包已满，无法拾取更多物品')
        return
      }

      // 从房间移除物品
      const roomItemIndex = this.currentRoom.items.findIndex(
          item => item.id === this.selectedRoomItem.id
      )
      if (roomItemIndex !== -1) {
        const [item] = this.currentRoom.items.splice(roomItemIndex, 1)
        // 添加到玩家背包
        this.player.inventory.push(item)
        this.$message.success(`已拾取: ${item.name}`)
        this.selectedRoomItem = null
      }
    },
    dropItem () {
      if (!this.selectedInventoryItem) return

      // 从背包移除物品
      const inventoryIndex = this.player.inventory.findIndex(
          item => item.id === this.selectedInventoryItem.id
      )
      if (inventoryIndex !== -1) {
        const [item] = this.player.inventory.splice(inventoryIndex, 1)
        // 添加到当前房间
        this.currentRoom.items.push(item)
        this.$message.success(`已丢弃: ${item.name}`)
        this.selectedInventoryItem = null
      }
    },
    useItem () {
      if (!this.selectedInventoryItem) return

      this.$message.success(`使用了: ${this.selectedInventoryItem.name}`)
      // 这里可以添加具体的使用逻辑
      this.selectedInventoryItem = null
    },
    showHelp () {
      this.helpVisible = true
      console.log('help')
    },
    logout () {
      this.$confirm('确定要退出游戏吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'success',
          message: '已退出游戏'
        })
        router.push("/auth/login")
        // 这里可以添加实际的退出逻辑，如跳转到登录页
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消退出'
        })
      })
    }
  }
}
</script>

<style scoped>
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
