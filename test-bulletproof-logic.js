#!/usr/bin/env node

/**
 * ResizeHandle BULLETPROOF 解决方案核心逻辑验证
 * 模拟浏览器环境测试事件拦截机制
 */

console.log('🧪 BULLETPROOF解决方案核心逻辑测试');
console.log('==========================================');

// 模拟浏览器事件系统
class MockEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = options.bubbles !== false;
    this.cancelable = options.cancelable !== false;
    this.defaultPrevented = false;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
  }
  
  preventDefault() {
    if (this.cancelable) {
      this.defaultPrevented = true;
      console.log('  📍 preventDefault() called');
    }
  }
  
  stopPropagation() {
    this.propagationStopped = true;
    console.log('  📍 stopPropagation() called');
  }
  
  stopImmediatePropagation() {
    this.immediatePropagationStopped = true;
    this.propagationStopped = true;
    console.log('  📍 stopImmediatePropagation() called');
  }
}

class MockDocument {
  constructor() {
    this.listeners = {
      capture: [],
      bubble: []
    };
  }
  
  addEventListener(type, listener, options = {}) {
    const capture = options.capture === true;
    const phase = capture ? 'capture' : 'bubble';
    this.listeners[phase].push({ type, listener, options });
    console.log(`  🎧 addEventListener: ${type} (${phase} phase)`);
  }
  
  removeEventListener(type, listener, options = {}) {
    const capture = options.capture === true;
    const phase = capture ? 'capture' : 'bubble';
    this.listeners[phase] = this.listeners[phase].filter(l => l.listener !== listener);
    console.log(`  🎧 removeEventListener: ${type} (${phase} phase)`);
  }
  
  dispatchEvent(event) {
    console.log(`📡 Dispatching ${event.type} event...`);
    
    // Capture phase
    console.log('  Phase 1: CAPTURE');
    for (const listener of this.listeners.capture) {
      if (listener.type === event.type && !event.immediatePropagationStopped) {
        console.log(`    🎯 Calling capture listener`);
        const result = listener.listener(event);
        if (result === false) {
          console.log('    ⚠️ Listener returned false');
          event.preventDefault();
        }
      }
    }
    
    // Target phase (模拟)
    if (!event.propagationStopped && !event.immediatePropagationStopped) {
      console.log('  Phase 2: TARGET (simulated)');
      console.log('    🎯 Target element handler would run here');
    } else {
      console.log('  Phase 2: TARGET (SKIPPED - propagation stopped)');
    }
    
    // Bubble phase
    if (!event.propagationStopped && !event.immediatePropagationStopped && event.bubbles) {
      console.log('  Phase 3: BUBBLE');
      for (const listener of this.listeners.bubble) {
        if (listener.type === event.type && !event.immediatePropagationStopped) {
          console.log(`    🎯 Calling bubble listener`);
          listener.listener(event);
        }
      }
    } else {
      console.log('  Phase 3: BUBBLE (SKIPPED)');
    }
    
    return !event.defaultPrevented;
  }
}

// 模拟我们的解决方案
class BulletproofResizeTest {
  constructor() {
    this.document = new MockDocument();
    this.resizeOperation = false;
    this.testResults = [];
  }
  
  // 模拟Document级别拦截器
  interceptDocumentClick(event) {
    console.log('  🚫 DOCUMENT CLICK INTERCEPTED during resize operation!');
    console.log('  🚫 Preventing ALL click events from propagating');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
  
  // 模拟Canvas点击处理器
  canvasClickHandler(event) {
    console.log('  🎯 Canvas handleCanvasClick triggered');
    if (this.resizeOperation) {
      console.log('  🔧 Canvas click blocked - resize operation in progress');
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    console.log('  🚨 CRITICAL: clearSelection called!');
    console.log('  📊 Selected elements updated: 0 selected_ids: []');
  }
  
  // 模拟resize handle mousedown
  startResize() {
    console.log('🔧 SETTING RESIZE OPERATION TO TRUE');
    this.resizeOperation = true;
    
    console.log('🛡️ Adding document-level click interceptor');
    this.document.addEventListener('click', this.interceptDocumentClick.bind(this), { capture: true });
    
    // 模拟Canvas事件监听器（bubble phase）
    this.document.addEventListener('click', this.canvasClickHandler.bind(this));
  }
  
  // 模拟resize结束
  endResize() {
    console.log('🛡️ Removing document-level click interceptor');
    this.document.removeEventListener('click', this.interceptDocumentClick.bind(this), { capture: true });
    
    console.log('🔧 CLEARING RESIZE OPERATION FLAG');
    this.resizeOperation = false;
  }
  
  // 运行测试
  runTest() {
    console.log('\n📋 Test 1: 正常Canvas点击（无resize操作）');
    console.log('----------------------------------------');
    this.document.addEventListener('click', this.canvasClickHandler.bind(this));
    const normalEvent = new MockEvent('click');
    this.document.dispatchEvent(normalEvent);
    
    const normalSuccess = normalEvent.defaultPrevented === false;
    this.recordTest('正常Canvas点击', normalSuccess, 
      normalSuccess ? '✅ 正常点击被处理，clearSelection被调用' : '❌ 正常点击未被正确处理');
    
    console.log('\n📋 Test 2: Resize期间的点击（应被拦截）');
    console.log('----------------------------------------');
    this.startResize();
    
    const interceptedEvent = new MockEvent('click');
    this.document.dispatchEvent(interceptedEvent);
    
    const interceptSuccess = interceptedEvent.immediatePropagationStopped && interceptedEvent.defaultPrevented;
    this.recordTest('Resize期间点击拦截', interceptSuccess, 
      interceptSuccess ? '✅ Document拦截器成功阻止了事件传播' : '❌ 事件未被正确拦截');
    
    this.endResize();
    
    console.log('\n📋 Test 3: Resize结束后的点击（应恢复正常）');
    console.log('----------------------------------------');
    const postResizeEvent = new MockEvent('click');
    this.document.dispatchEvent(postResizeEvent);
    
    const postResizeSuccess = postResizeEvent.defaultPrevented === false;
    this.recordTest('Resize结束后恢复', postResizeSuccess,
      postResizeSuccess ? '✅ 拦截器移除后，正常功能恢复' : '❌ 功能未正确恢复');
    
    this.printResults();
  }
  
  recordTest(name, passed, message) {
    this.testResults.push({ name, passed, message });
    console.log(`\n${passed ? '✅' : '❌'} ${name}: ${message}`);
  }
  
  printResults() {
    console.log('\n🎉 测试完成！');
    console.log('==========================================');
    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    
    console.log(`总测试: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${total - passed}`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('\n🎊 所有测试通过！BULLETPROOF解决方案逻辑正确！');
      console.log('📋 核心机制验证成功：');
      console.log('   ✅ Document级别拦截器在capture phase工作');
      console.log('   ✅ 事件传播被正确阻断');
      console.log('   ✅ Canvas处理器不会被触发');
      console.log('   ✅ 状态管理正确，拦截器能正确移除');
    } else {
      console.log('\n⚠️ 部分测试失败，需要检查实现。');
    }
  }
}

// 运行测试
const test = new BulletproofResizeTest();
test.runTest();