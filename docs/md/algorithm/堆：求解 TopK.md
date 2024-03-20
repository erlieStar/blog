# 堆：求解 TopK
![请添加图片描述](https://img-blog.csdnimg.cn/c1c999cb7549441ebda4e38e86a20f54.jpg?)
## 堆
堆是一种数据结构，需要满足如下几个特性
1. 堆是一颗完全二叉树（生成节点的顺序是从左往右，从上往下依次进行）
2. 堆中某个节点值总是不大于或者不小于其父节点的值

**将根结点最大的堆叫做最大堆或大根堆，根结点最小的堆叫做最小堆或小根堆**

![请添加图片描述](https://img-blog.csdnimg.cn/3aae3c5cb27040878df98eab1b4ddeb4.png?)

大根堆和小根堆如下图所示

![请添加图片描述](https://img-blog.csdnimg.cn/aae9e3f5a5b84720b281887f64b02d34.png?)

大部分语言都会内置堆的实现，即优先级队列（Java中为PriorityQueue），所以当我们有用到堆的场景时，直接用PriorityQueue即可

```java
// 小根堆
int[] array = {1, 7, 3, 5, 8};
PriorityQueue<Integer> queue = new PriorityQueue<>();
for (int i = 0; i < array.length; i++) {
    queue.add(array[i]);
}
// 1 3 5 7 8
while (!queue.isEmpty()) {
	// 返回队列的第一个元素并删除
    System.out.println(queue.poll());
}

// 大根堆
queue = new PriorityQueue<>((num1, num2) -> num2 - num1);
for (int i = 0; i < array.length; i++) {
    queue.add(array[i]);
}
// 8 7 5 3 1
while (!queue.isEmpty()) {
    System.out.println(queue.poll());
}
```

## 堆的应用场景
面试中常问的Top k问题，就可以先排序，然后求出Top k的元素

**更高效的思路是用堆和快排。Top K问题问法很多，本质思路都一样，例如求前K个最大的元素，求前K个最小的元素，求前K个高频元素**

### 数组中的第K个最大元素
题目地址：LeetCode 215
题目描述：
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/3e128d0e4f4e4ff4ae467a4e8f9db377.png)

维护一个小顶堆，数量不足 k 个时，一直往堆中存放元素，超过 k 个时，删除堆中最大的元素
```java
public class Solution {

    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int n : nums) {
            heap.add(n);
            if (heap.size() > k) {
                heap.poll();
            }
        }
        return heap.poll();
    }

}
```

用快速排序倒序排，判断 k 和 基准值的坐标，来决定对哪段分区进行排列，或者直接返回

```java
public class Solution {

    public int quickSort(int[] a, int left, int right, int k) {
        if (left >= right) {
            return a[right];
        }
        int x = left, y = right, z = a[left];
        while (x < y) {
            while (x < y && a[y] <= z) {
                y--;
            }
            if (x < y) {
                a[x++] = a[y];
            }
            while (x < y && a[x] >= z) {
                x++;
            }
            if (x < y) {
                a[y--] = a[x];
            }
        }
        a[x] = z;
        if (k >= left && k <= x - 1) {
             return quickSort(a, left, x - 1, k);
        }
        if (k >= x + 1 && k <= right) {
            return quickSort(a, x + 1, right, k);
        }
        return a[x];
    }

    public int findKthLargest(int[] nums, int k) {
        return quickSort(nums, 0, nums.length - 1, k - 1);
    }

}
```

### 最小的k个数
题目地址：剑指 Offer 40. 最小的k个数

输入整数数组 arr ，找出其中最小的 k 个数。例如，输入4、5、1、6、2、7、3、8这8个数字，则最小的4个数字是1、2、3、4。

```java
输入：arr = [3,2,1], k = 2
输出：[1,2] 或者 [2,1]
```
限制：

0 <= k <= arr.length <= 10000

0 <= arr[i] <= 10000


**堆**

维护一个大顶堆
当堆中的元素不够k时，一直往堆中放元素即可
当堆中的元素大于等于k时，将堆顶的元素和新添加的元素进行比较。如果新添的元素比堆顶的元素小，则应该把堆顶的元素删除，将新填的元素放入堆，这样就能保证堆中的元素一直是最小的k个

```java
public int[] getLeastNumbers(int[] arr, int k) {
    if (arr.length == 0 || k == 0) {
        return new int[0];
    }
    PriorityQueue<Integer> queue = new PriorityQueue<>((num1, num2) -> num2 - num1);
    for (int num : arr) {
        if (queue.size() < k) {
            queue.add(num);
        } else if (num < queue.peek()) {
            queue.poll();
            queue.add(num);
        }
    }
    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        result[i] = queue.poll();
    }
    return result;
}
```

**计数排序**

因为题目中有这样一个条件0 <= arr[i] <= 10000，说明数组中的元素比较集中，我们就可以用计数排序来解决这个问题，因为arr[i]的最大值10000为，所以我每次直接开一个10001大的数组

```java
public int[] getLeastNumbers(int[] arr, int k) {
    if (arr.length == 0 || k == 0) {
        return new int[0];
    }
    int[] countArray = new int[10001];
    for (int num : arr) {
        countArray[num]++;
    }
    int[] result = new int[k];
    int index = 0;
    for (int i = 0; i < countArray.length && index < k; i++) {
        while (countArray[i] > 0 && index < k) {
            countArray[i]--;
            result[index++] = i;
        }
    }
    return result;
}
```
### 前 K 个高频元素
题目描述：
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/fca8fe7617c94e089f44096da4d0c818.png)
题目地址：LeetCode 347

```java
class Solution {
    
    public int[] topKFrequent(int[] nums, int k) {
        PriorityQueue<int[]> queue = new PriorityQueue<>((a1, a2) -> a1[1] - a2[1]);
        Map<Integer, Integer> map = new HashMap<>();
        for (int num : nums) {
            map.put(num, map.getOrDefault(num, 0) + 1);
        }
        for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
            int key = entry.getKey();
            int value = entry.getValue();
            if (queue.size() < k) {
                queue.add(new int[] {key, value});
            } else if (queue.peek()[1] < value){
                queue.poll();
                queue.add(new int[] {key, value});
            }
        }
        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = queue.poll()[0];
        }
        return result;
    }
}
```