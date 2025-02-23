# 搜索：DFS和BFS遍历图的方式有哪些不同？
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/47088907217938a7054175952d211378.jpeg)
## 应用场景
**DFS和BFS都是对图进行遍历的算法（树的图的一种），二者的区别只是对图遍历的策略不同**

DFS：按照一个方向遍历，直到不能遍历了，才换一个方向遍历。
BFS：从起点开始，依次对周边的节点进行遍历，遍历完再对周边节点的周边节点再进行遍历，以此类推，直到把图遍历完。

我们以迷宫演示一下DFS和BFS遍历的过程。假设有一个4*4的迷宫，其中标为红色的区域不能经过，问能否从迷宫的（0，0）这个坐标移动到（3，3）这个坐标

**我们遍历时要按照一个固定的策略对每个节点的4个方向都进行遍历，这样才不会漏掉，假设遍历的方向为上，下，左，右**

### BFS遍历图示

![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/4f26ef72fa9a6bd6cea619a91e00e35a.png)
**开始第一次遍历**

从（0，0）节点开始
向上遍历为（0，-1），出界了，不用遍历。
向下遍历为（1，0），并且将（1，0）放入队列，以便后续遍历（1，0）周边的节点
向左遍历为（-1，0），出界了，不用遍历。
向右遍历为（0，1），将（0，1）放入队列。

**开始第二次遍历**
（0，0）这个节点4个方向都遍历完了，我们遍历他周边的节点（1，0）和（0，1）

遍历（1，0）
向上遍历为（0，0），之前都遍历了，我们不用再遍历了，所以已经遍历过节点要标记一下，以后看到标记就不用遍历了，不然就陷入死循环了
向下遍历为（2，0），将（2，0）放入队列
向左遍历为（1，-1），出界了，不用遍历
向右遍历为（1，1），将（1，1）放入队列。

遍历（0，1）
过程和上面类似，不分析了

理解了BFS的遍历思路，我就直接总结一下BFS的模版

```java
queue.add(遍历开始的节点)
while (!queue.isEmpty()) {
    int size = queue.size();
    // 判断的时候不能用 i < queue.size()，因为queue.size()的值在一直变
    for (int i = 0; i < size; i++) {
        // 弹出队列的头节点，根据头节点算出周边节点
        int[] item = queue.poll();
        遍历周边方向的节点
        queue.add(周边节点);
        将周边节点标记为已经遍历
    }
}
图遍历完了
```
标记周边节点已经遍历的方式有很多种
1. 创建一个visit数组，如果对应座标的值为1，说明节点已经被遍历。如果对应座标的值为0，说明节点没有被遍历
2. 可以直接利用题目中的条件，假如题目中用1表示这个节点不能被经过，0可以经过。我们遍历的时候就可以将经过的节点重置为1
### DFS遍历图示
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/d17a330bc4d941e6fbb21b50acbf505f.png)

从（0，0）节点开始
向上遍历为（-1，0），出界了，不用遍历。
向下遍历为（1，0）

从（1，0）节点开始
向上遍历为（0，0），已经遍历过程，不用遍历
向下遍历为（2，0）

从（2，0）节点开始
向上遍历为（1，0），已经遍历过程，不用遍历
向下遍历为（3，0），不能通过哈
向左遍历为（2，-1），出界了，不用遍历
向右遍历为（2，1）

从（2，1）节点开始
向上遍历为（1，1）

从（1，1）节点开始
...

第一次到达（3，3）时经过的节点如上图左边所示

**然后依次重新决策，即回退**

10上下左右都遍历过了
9上下左右都遍历过了
8上下左都遍历过了，右向遍历为（2，3）
然后依次经过（1，3）（0，3）（3，3），再次到达（3，3）

**然后再重新决策，即回退**

## 二进制矩阵中的最短路径
题目地址：LeetCode 1091. 二进制矩阵中的最短路径

给你一个 n x n 的二进制矩阵 grid 中，返回矩阵中最短 畅通路径 的长度。如果不存在这样的路径，返回 -1 。

二进制矩阵中的 畅通路径 是一条从 左上角 单元格（即，(0, 0)）到 右下角 单元格（即，(n - 1, n - 1)）的路径，该路径同时满足下述要求：

路径途经的所有单元格都的值都是 0 。
路径中所有相邻的单元格应当在 8 个方向之一 上连通（即，相邻两单元之间彼此不同且共享一条边或者一个角）。
畅通路径的长度 是该路径途经的单元格总数。

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/fd6a5be48ff4610be4f97f6f46660445.png)
```java
输入：grid = [[0,0,0],[1,1,0],[1,1,0]]
输出：4
```

我们先通过回溯算法把从（0，0）到（n-1，n-1）的所有路径全算出来，然后比较出最小的

```java
public class Solution {

    // 代表8个方向 左，右，上，下
    // 左上，左下，右上，右下
    int[][] dir = {{-1, 0}, {1, 0}, {0, -1}, {0, 1},
            {-1, -1}, {-1, 1}, {1, -1}, {1, 1}};

    int min = Integer.MAX_VALUE;

    public int shortestPathBinaryMatrix(int[][] grid) {
        if (grid[0][0] == 1) {
            return -1;
        }
        int n = grid.length - 1;
        backtracking(grid, n,0, 0, 1);
        return min == Integer.MAX_VALUE ? -1 : min;
    }

    public void backtracking(int[][] grid, int n, int row, int column, int step) {
        // 当前走的路径已经大于等于目前最少的步数了，没必要再搜索了
        if (step >= min) {
            return;
        }
        if (row == n && column == n) {
            min = Math.min(min, step);
            return;
        }
        for (int i = 0; i < 8; i++) {
            int x = row + dir[i][0];
            int y = column + dir[i][1];
            if (x < 0 || x > n || y < 0 || y > n || grid[x][y] == 1) {
                continue;
            }
            grid[x][y] = 1;
            backtracking(grid, n, x, y, step + 1);
            grid[x][y] = 0;
        }
    }
}
```
这个代码是能算出正确结果的，但是当图非常大的时候，即使减枝也很容易超时，因为要搜索的空间太大了。

**我们可以换BFS的方式对图进行遍历，因为当遍历到（n-1，n-1）这个节点时，路径一定是最短的。因为BFS是按照一层一层的方式来遍历的，同时搜索空间比DFS小很多，所以此时效率比较高。**

```java
class Solution {

    // 代表8个方向 左，右，上，下
    // 左上，左下，右上，右下
    int[][] dir = {{-1, 0}, {1, 0}, {0, -1}, {0, 1},
            {-1, -1}, {-1, 1}, {1, -1}, {1, 1}};

    public int shortestPathBinaryMatrix(int[][] grid) {
        if (grid[0][0] == 1) {
            return -1;
        }
        int n = grid.length - 1;
        Queue<int[]> queue = new LinkedList<>();
        queue.add(new int[] {0, 0});
        grid[0][0] = 1;
        int result = 0;
        while (!queue.isEmpty()) {
            result++;
            int size = queue.size();
            // 判断的时候不能用 i < queue.size()，因为queue.size()的值在一直变
            for (int i = 0; i < size; i++) {
                int[] item = queue.poll();
                for (int j = 0; j < 8; j++) {
                    if (item[0] == n && item[1] == n) {
                        return result;
                    }
                    int x = item[0] + dir[j][0];
                    int y = item[1] + dir[j][1];
                    if (x < 0 || x > n || y < 0 || y > n || grid[x][y] == 1) {
                        continue;
                    }
                    queue.add(new int[] {x, y});
                    grid[x][y] = 1;
                }
            }
        }
        return -1;
    }
}
```
其实当寻找图的最短路径时，用DFS和BFS都能得到正确的结果。当图比较小时，DFS和BFS的效率差不多。当图比较大时，BFS的效率就比DFS高很多。

## 岛屿数量
题目地址：LeetCode 200. 岛屿数量
给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。

示例1

```java
输入：grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
输出：1
```
我们可以对图的每个陆地节点进行标记，标记这个节点的时候，同时把这个节点可以访问到陆地节点都重置为水，这样标记了几次说明有几个岛屿。

**因为只是对图访问过的节点进行标记，所以BFS和DFS的效率一样，用两种写法都可以**

使用DFS的方式标记

```java
class Solution {

    int[][] dir = {{-1, 1, 0, 0},{0, 0, -1, 1}};

    public int numIslands(char[][] grid) {
        int sum = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[i].length; j++) {
                if (grid[i][j] == '1') {
                    sum++;
                    dfs(i, j, grid);
                }
            }
        }
        return sum;
    }

    public void dfs(int row, int column, char[][] grid) {
        // 区间合法性判断
        if (row < 0 || row >= grid.length || column < 0 || column >= grid[0].length) {
            return;
        }
        if (grid[row][column] == '1') {
            grid[row][column] = '0';
            for (int i = 0; i < dir[0].length; i++) {
                dfs(row + dir[0][i], column + dir[1][i], grid);
            }
        }
    }

}
```

**使用BFS的方式标记**
```java
class Solution {

    // 分别代表上下左右4个方向
    int[][] dir = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

    public int numIslands(char[][] grid) {
        int sum = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[i].length; j++) {
                if (grid[i][j] == '1') {
                    sum++;
                    bfs(i, j, grid);
                }
            }
        }
        return sum;
    }

    public void bfs(int row, int column, char[][] grid) {
        Queue<int[]> queue = new LinkedList<>();
        queue.add(new int[]{row, column});
        grid[row][column] = '0';
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] item = queue.poll();
                for (int j = 0; j < dir.length; j++) {
                    int x = item[0] + dir[j][0];
                    int y = item[1] + dir[j][1];
                    if (x < 0 || x >= grid.length || y < 0
                            || y >= grid[0].length || grid[x][y] == '0') {
                        continue;
                    }
                    queue.add(new int[]{x, y});
                    grid[x][y] = '0';
                }
            }
        }
    }
}
```
## 隐式图遍历
有些题目一看就是对图进行遍历，但是有些题看起来虽然和图没有关系，但是最终的过程还是对图进行遍历的过程，这个图就是我们对问题进行抽象得出来的图。

### 倒水问题
给你一个装满水的6升的杯子，空的3升的杯子和1升的杯子，3个杯子都没有刻度。在不使用其他道具的情况下能否量出4升的水呢？

相信大家小时候都玩过类似的有游戏，我们经常要绞尽脑汁想半天，其实这种题本质上是对图的一种遍历过程，我们写一个BFS或者DFS就能得出所有的解法
![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/abe52aa2c55750149674b7d827001ab0.png)
如上图(6, 0, 0) -> (3, 3, 0) -> (3, 2, 1) -> (4, 2, 0)就是一种解法

![请添加图片描述](https://i-blog.csdnimg.cn/blog_migrate/c3291bcc1f4fa0e5f22bc54c22bb3abb.png)
以后你再遇到类似的问题，例如有一个S升的可乐，和2个M升和N升的杯子，问如何将可乐平分倒进杯子中，是不是立马就知道该怎么做了？
### 打开转盘锁
题目地址：LeetCode 752. 打开转盘锁

你有一个带有四个圆形拨轮的转盘锁。每个拨轮都有10个数字： '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' 。每个拨轮可以自由旋转：例如把 '9' 变为 '0'，'0' 变为 '9' 。每次旋转都只能旋转一个拨轮的一位数字。

锁的初始数字为 '0000' ，一个代表四个拨轮的数字的字符串。

列表 deadends 包含了一组死亡数字，一旦拨轮的数字和列表里的任何一个元素相同，这个锁将会被永久锁定，无法再被旋转。

字符串 target 代表可以解锁的数字，你需要给出解锁需要的最小旋转次数，如果无论如何不能解锁，返回 -1 。

示例 1:

```java
输入：deadends = ["0201","0101","0102","1212","2002"], target = "0202"
输出：6
解释：
可能的移动序列为 "0000" -> "1000" -> "1100" -> "1200" -> "1201" -> "1202" -> "0202"。
注意 "0000" -> "0001" -> "0002" -> "0102" -> "0202" 这样的序列是不能解锁的，
因为当拨动到 "0102" 时这个锁就会被锁定。
```

隐式图遍历的问法有很多种，例如从一字符串如何通过一系列操作得到另一个字符串，且操作数最少。**这个题目一看就是隐式图遍历，唯一发生变化的是有些字符串不允许被操作，我们提前把这些节点在图中标记为已经访问就可以了**

**然后针对每个位置的锁向上旋转，向下旋转遍历即可**

```java
class Solution {

    public int openLock(String[] deadends, String target) {
        Set<String> visit = new HashSet<>();
        for (String deadend : deadends) {
            if (deadend.equals("0000")) {
                return -1;
            }
            visit.add(deadend);
        }
        Queue<String> queue = new LinkedList<>();
        queue.add("0000");
        visit.add("0000");
        int total = 0;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                String item = queue.poll();
                if (item.equals(target)) {
                    return total;
                }
                for (int j = 0; j < 4; j++) {
                    char[] chars = item.toCharArray();
                    char temp = chars[j];
                    // 将数字旋转变大
                    chars[j] = nextNum(temp);
                    String str = new String(chars);
                    if (!visit.contains(str)) {
                        queue.add(str);
                        visit.add(str);
                    }
                    // 将数组旋转变小
                    chars[j] = preNum(temp);
                    str = new String(chars);
                    if (!visit.contains(str)) {
                        queue.add(str);
                        visit.add(str);
                    }
                }
            }
            total++;
        }
        return -1;
    }

    public char nextNum(char num) {
        return num == '9' ? '0' : (char) (num + 1);
    }

    public char preNum(char num) {
        return num == '0' ? '9' : (char) (num - 1);
    }
}
```
## 总结
1. DFS比较适合搜索式的问题，例如是否可以从图的一点移动到另一点。而BFS比较适合查询图2点之间的最短距离
2. DFS一般情况下时间复杂度比较高，BFS一般情况下空间复杂度比较高（当某一个层的相邻节点很多时，队列中就会存入大量的节点）