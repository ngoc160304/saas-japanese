import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { afterEach, test } from 'node:test';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');

function load(path, mocks = {}) {
  const file = resolve(root, path);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const mod = { exports: {} };
  const require = createRequire(file);
  new Script(`(function(require,module,exports){${source}\n})`, {
    filename: file,
  }).runInThisContext()((name) => (name in mocks ? mocks[name] : require(name)), mod, mod.exports);
  return mod.exports;
}

afterEach(() => {
  delete globalThis.document;
});

test('orders API posts only selected cart item IDs with bank transfer through configured client', async () => {
  let request;
  const order = { id: 9, checkoutUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init' };
  const { ordersAPI } = load('apis/orders/orders.api.ts', {
    '@/lib/authorize-axios': {
      post: async (url, data, config) => {
        request = { url, data, config };
        return { data: { data: order } };
      },
    },
  });

  assert.equal(
    await ordersAPI.create({ cartItemIds: [32, 33], paymentMethod: 'BANK_TRANSFER' }),
    order,
  );
  assert.deepEqual(request, {
    url: '/orders',
    data: { cartItemIds: [32, 33], paymentMethod: 'BANK_TRANSFER' },
    config: { localErrorHandling: true },
  });
});

test('selection derives payloads and totals from current cart items, pruning stale and duplicate IDs', () => {
  const selection = load('features/cart/utils/cart-selection.ts');
  const items = [
    { id: 32, courseId: 12, courseTitle: 'A', price: 5615, thumbnailUrl: null },
    { id: 33, courseId: 10, courseTitle: 'B', price: 50, thumbnailUrl: null },
  ];

  assert.deepEqual(
    selection.getSelectedCartItems(items, []).map((item) => item.id),
    [],
  );
  assert.deepEqual(
    selection.getSelectedCartItems(items, [32]).map((item) => item.id),
    [32],
  );
  assert.deepEqual(
    selection.getSelectedCartItems(items, [32, 33]).map((item) => item.id),
    [32, 33],
  );
  assert.deepEqual(
    selection
      .getSelectedCartItems(
        items,
        [32, 33].filter((id) => id !== 32),
      )
      .map((item) => item.id),
    [33],
  );
  assert.equal(selection.getCartItemsTotal(selection.getSelectedCartItems(items, [32, 33])), 5665);
  assert.deepEqual(selection.reconcileSelectedCartItemIds([32, 32, 999, 33], items), [32, 33]);
  assert.deepEqual(
    selection.reconcileSelectedCartItemIds(
      [32],
      [...items, { id: 34, courseId: 11, courseTitle: 'New', price: 100, thumbnailUrl: null }],
    ),
    [32],
  );
  assert.deepEqual(selection.reconcileSelectedCartItemIds([32, 33], items.slice(1)), [33]);
});

function createFakeDocument({ submitError } = {}) {
  const appendedForms = [];
  const submittedForms = [];

  class FakeHTMLFormElement {
    constructor() {
      this.children = [];
      this.removed = false;
    }

    append(input) {
      this.children.push(input);
      if (input.name === 'submit') this.submit = input;
    }

    remove() {
      this.removed = true;
    }
  }

  FakeHTMLFormElement.prototype.submit = function submit() {
    if (submitError) throw submitError;
    submittedForms.push(this);
  };

  const document = {
    defaultView: { HTMLFormElement: FakeHTMLFormElement, setTimeout() {} },
    createElement(tag) {
      if (tag === 'form') {
        const form = new FakeHTMLFormElement();
        form.ownerDocument = document;
        return form;
      }
      return { type: '', name: '', value: '' };
    },
    body: {
      append(form) {
        appendedForms.push(form);
      },
    },
  };

  return { document, appendedForms, submittedForms };
}

test('SePay submission uses native self-targeted POST and preserves every field in backend order', () => {
  const checkout = load('features/cart/utils/sepay-checkout.ts');
  const fake = createFakeDocument();
  globalThis.document = fake.document;
  const checkoutFields = {
    order_amount: '5615',
    submit: 'unchanged-submit-value',
    merchant: 'SP-TEST-HT8B2945',
    signature: 'backend-generated-signature',
  };
  const data = checkout.getSePayCheckoutData({
    checkoutUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
    checkoutFields,
  });

  checkout.submitSePayCheckout(data);

  assert.equal(fake.submittedForms.length, 1);
  const form = fake.submittedForms[0];
  assert.equal(form.method, 'POST');
  assert.equal(form.action, 'https://pay-sandbox.sepay.vn/v1/checkout/init');
  assert.equal(form.target, '_self');
  assert.equal(form.enctype, 'application/x-www-form-urlencoded');
  assert.deepEqual(
    form.children.map(({ name, value }) => [name, value]),
    Object.entries(checkoutFields),
  );
  assert.equal(form.removed, false);
});

test('missing checkout data and native submission failures are reported and temporary forms removed', () => {
  const checkout = load('features/cart/utils/sepay-checkout.ts');
  assert.throws(
    () => checkout.getSePayCheckoutData({ checkoutUrl: null, checkoutFields: null }),
    /thiếu thông tin thanh toán/,
  );

  const fake = createFakeDocument({ submitError: new Error('blocked') });
  globalThis.document = fake.document;
  assert.throws(
    () =>
      checkout.submitSePayCheckout({
        checkoutUrl: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
        checkoutFields: { signature: 'unchanged' },
      }),
    /Không thể chuyển đến cổng thanh toán/,
  );
  assert.equal(fake.appendedForms.length, 1);
  assert.equal(fake.appendedForms[0].removed, true);
});
