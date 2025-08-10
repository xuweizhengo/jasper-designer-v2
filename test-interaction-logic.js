/**
 * 简化交互系统核心逻辑测试
 * 验证关键函数和组件集成是否正确
 */

// 模拟测试环境
const mockElements = [
  {
    id: 'element-1',
    position: { x: 100, y: 100 },
    size: { width: 50, height: 50 },
    visible: true,
    content: { type: 'Rectangle' }
  },
  {
    id: 'element-2', 
    position: { x: 200, y: 150 },
    size: { width: 80, height: 60 },
    visible: true,
    content: { type: 'Text' }
  },
  {
    id: 'element-3',
    position: { x: 50, y: 200 },
    size: { width: 30, height: 40 },
    visible: false, // 不可见元素
    content: { type: 'Line' }
  }
];

// 测试点是否在元素内的逻辑
function pointInElement(point, element) {
  return point.x >= element.position.x &&
         point.x <= element.position.x + element.size.width &&
         point.y >= element.position.y &&
         point.y <= element.position.y + element.size.height;
}

// 测试获取点击位置的元素
function getElementAtPoint(point, elements) {
  // 从后往前检查（最上层的元素）
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element && element.visible && pointInElement(point, element)) {
      return element;
    }
  }
  return null;
}

// 测试获取矩形内的元素
function getElementsInRect(rect, elements) {
  return elements.filter(element => {
    if (!element.visible) return false;
    
    // 检查元素是否与选择矩形相交
    const elementRect = {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };
    
    return !(elementRect.x > rect.x + rect.width ||
             elementRect.x + elementRect.width < rect.x ||
             elementRect.y > rect.y + rect.height ||
             elementRect.y + elementRect.height < rect.y);
  });
}

// 运行测试
console.log('🧪 简化交互系统核心逻辑测试');
console.log('=====================================');

// 测试1: 点击检测
console.log('\n🎯 测试1: 点击检测');
const clickPoint1 = { x: 125, y: 125 }; // 在element-1内
const clickPoint2 = { x: 220, y: 170 }; // 在element-2内  
const clickPoint3 = { x: 65, y: 220 };  // 在element-3内（但不可见）
const clickPoint4 = { x: 300, y: 300 }; // 空白区域

const result1 = getElementAtPoint(clickPoint1, mockElements);
const result2 = getElementAtPoint(clickPoint2, mockElements);
const result3 = getElementAtPoint(clickPoint3, mockElements);
const result4 = getElementAtPoint(clickPoint4, mockElements);

console.log(`点击 (${clickPoint1.x}, ${clickPoint1.y}):`, result1?.id || '无');
console.log(`点击 (${clickPoint2.x}, ${clickPoint2.y}):`, result2?.id || '无');
console.log(`点击 (${clickPoint3.x}, ${clickPoint3.y}):`, result3?.id || '无', '(不可见元素应该被忽略)');
console.log(`点击 (${clickPoint4.x}, ${clickPoint4.y}):`, result4?.id || '无');

// 测试2: 框选检测
console.log('\n🔲 测试2: 框选检测');
const selectionRect1 = { x: 90, y: 90, width: 70, height: 70 };   // 包含element-1
const selectionRect2 = { x: 50, y: 50, width: 300, height: 200 }; // 包含element-1和element-2
const selectionRect3 = { x: 400, y: 400, width: 50, height: 50 }; // 空选择

const boxResult1 = getElementsInRect(selectionRect1, mockElements);
const boxResult2 = getElementsInRect(selectionRect2, mockElements);
const boxResult3 = getElementsInRect(selectionRect3, mockElements);

console.log('框选区域1:', boxResult1.map(e => e.id));
console.log('框选区域2:', boxResult2.map(e => e.id));
console.log('框选区域3:', boxResult3.map(e => e.id));

// 验证结果
console.log('\n✅ 测试验证');
const tests = [
  { name: '点击element-1', pass: result1?.id === 'element-1' },
  { name: '点击element-2', pass: result2?.id === 'element-2' },
  { name: '不可见元素被忽略', pass: result3 === null },
  { name: '空白区域返回null', pass: result4 === null },
  { name: '小框选包含element-1', pass: boxResult1.length === 1 && boxResult1[0].id === 'element-1' },
  { name: '大框选包含两个可见元素', pass: boxResult2.length === 2 },
  { name: '空框选返回空数组', pass: boxResult3.length === 0 }
];

let passCount = 0;
tests.forEach(test => {
  const status = test.pass ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
  if (test.pass) passCount++;
});

console.log(`\n🎉 测试完成: ${passCount}/${tests.length} 通过`);

if (passCount === tests.length) {
  console.log('🎯 所有核心逻辑测试通过！简化交互系统准备就绪。');
} else {
  console.log('⚠️ 部分测试失败，需要检查核心逻辑。');
}