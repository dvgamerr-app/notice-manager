const PRODUCT_NAME = 'Notice Manager'
const OPERATOR_NAME = 'Kananek Thongkam'
const CONTACT_EMAIL = 'info.dvgamer@gmail.com'
const LAST_UPDATED = '16 สิงหาคม 2569'

const styles = `
  :root {
    color-scheme: light;
    font-family: "Noto Sans Thai", "Noto Sans", system-ui, -apple-system, sans-serif;
    color: #243029;
    background: #f3f7f4;
    font-synthesis: none;
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-width: 320px; line-height: 1.75; }
  a { color: #057a37; text-underline-offset: 3px; }
  a:hover { color: #045c2b; }
  .shell { width: min(100% - 32px, 760px); margin: 0 auto; }
  header { padding: 40px 0 28px; }
  .brand { display: inline-flex; align-items: center; gap: 10px; color: #163c25; font-weight: 750; text-decoration: none; }
  .mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 11px; color: white; background: #06c755; font-size: 17px; }
  main { padding-bottom: 40px; }
  article { overflow: hidden; border: 1px solid #dce7df; border-radius: 24px; background: white; box-shadow: 0 16px 50px rgba(31, 65, 43, .08); }
  .hero { padding: 40px 44px 32px; color: white; background: linear-gradient(135deg, #064f2a, #07833d); }
  h1 { margin: 0; font-size: clamp(2rem, 7vw, 3.25rem); line-height: 1.18; letter-spacing: -.035em; }
  .intro { max-width: 620px; margin: 16px 0 0; color: #e2f7e9; font-size: 1.02rem; }
  .updated { margin: 16px 0 0; color: #bfe8ce; font-size: .86rem; }
  .content { padding: 16px 44px 40px; }
  section { padding-top: 24px; }
  h2 { margin: 0 0 8px; color: #163c25; font-size: 1.18rem; line-height: 1.4; }
  p { margin: 8px 0; }
  ul { margin: 10px 0; padding-left: 24px; }
  li + li { margin-top: 7px; }
  .note { margin-top: 18px; padding: 16px 18px; border-radius: 14px; background: #eef8f1; color: #275c38; }
  footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px 24px; padding: 24px 0 42px; color: #65746a; font-size: .88rem; }
  nav { display: flex; flex-wrap: wrap; gap: 18px; }
  @media (max-width: 600px) {
    header { padding-top: 24px; }
    .hero { padding: 30px 24px 26px; }
    .content { padding: 8px 24px 30px; }
    article { border-radius: 20px; }
  }
  @media print {
    :root { background: white; }
    .shell { width: 100%; }
    header, footer { display: none; }
    article { border: 0; box-shadow: none; }
    .hero { padding: 0 0 20px; color: #243029; background: none; }
    .intro, .updated { color: #243029; }
    .content { padding: 0; }
  }
`

const privacyContent = `
  <section>
    <h2>1. ขอบเขตของนโยบาย</h2>
    <p>นโยบายนี้อธิบายการประมวลผลข้อมูลส่วนบุคคลโดย ${PRODUCT_NAME} ซึ่งเป็นระบบสำหรับผู้ดูแลในการจัดการ LINE Messaging API หลายบัญชี ทั้งข้อมูลของผู้ดูแลระบบและข้อมูลของบุคคลที่ติดต่อกับ LINE Official Account ที่เชื่อมต่อกับระบบ</p>
  </section>
  <section>
    <h2>2. ข้อมูลที่เราเก็บ</h2>
    <ul>
      <li><strong>ข้อมูลบัญชีผู้ดูแล:</strong> LINE user ID, ชื่อที่แสดง, รูปโปรไฟล์ และเวลาที่เข้าใช้งาน โดยระบบไม่ขอรหัสผ่าน LINE และไม่เก็บ LIFF access token หลังยืนยันตัวตน</li>
      <li><strong>ข้อมูลการเชื่อมต่อบอต:</strong> Bot user ID, Channel access token, Channel secret, webhook URL, สถานะและโควตาของ Messaging API โดย credential ถูกเข้ารหัสก่อนจัดเก็บ</li>
      <li><strong>ข้อมูลแชตและ webhook:</strong> LINE user ID, group ID หรือ room ID ตามประเภทแชต ชื่อและรูปของแชต เหตุการณ์ webhook เนื้อหาที่ LINE ส่งให้บอต และเวลาที่เกิดเหตุการณ์</li>
      <li><strong>ข้อมูลการส่งข้อความ:</strong> ผู้รับ เนื้อหาข้อความ สถานะการส่ง การตอบกลับหรือข้อผิดพลาดจาก LINE และ LINE request ID</li>
      <li><strong>ข้อมูลความปลอดภัยและการใช้งาน:</strong> session, audit log, API key hash, ตัวนับ rate limit และเวลาในการดำเนินการต่าง ๆ ระบบจัดเก็บเฉพาะ hash ของ session token และ API key ฝั่งเซิร์ฟเวอร์</li>
    </ul>
  </section>
  <section>
    <h2>3. วัตถุประสงค์และฐานในการประมวลผล</h2>
    <p>เราใช้ข้อมูลเพื่อยืนยันและกำหนดสิทธิ์ผู้ดูแล ตั้งค่าและให้บริการบอต รับและตอบสนอง webhook ส่งข้อความตามคำสั่ง แสดงประวัติและสถานะ แก้ไขปัญหา ป้องกันการใช้งานที่ไม่เหมาะสม และรักษาความปลอดภัยของระบบ โดยอาศัยความจำเป็นในการให้บริการ การดำเนินการตามคำขอ ความยินยอมเมื่อกฎหมายกำหนด ประโยชน์โดยชอบด้วยกฎหมายด้านความปลอดภัย และหน้าที่ตามกฎหมายที่เกี่ยวข้อง</p>
  </section>
  <section>
    <h2>4. การเปิดเผยและผู้ให้บริการภายนอก</h2>
    <p>ข้อมูลอาจถูกส่งให้ LINE เพื่อยืนยันบัญชี รับ webhook ตรวจสอบหรือส่งข้อความ รวมถึงผู้ให้บริการโฮสติ้ง ฐานข้อมูล เครือข่าย และระบบบันทึกเหตุการณ์ที่จำเป็นต่อการให้บริการ เราไม่ขายข้อมูลส่วนบุคคล และจะเปิดเผยแก่หน่วยงานรัฐหรือบุคคลอื่นเมื่อมีกฎหมาย คำสั่งที่ชอบด้วยกฎหมาย หรือความจำเป็นเพื่อคุ้มครองสิทธิและความปลอดภัยเท่านั้น</p>
    <p>LINE และผู้ให้บริการโครงสร้างพื้นฐานอาจประมวลผลข้อมูลในต่างประเทศตามที่ตั้งของระบบและนโยบายของผู้ให้บริการนั้น โดยผู้ดูแลระบบจะใช้มาตรการที่เหมาะสมตามกฎหมายที่ใช้บังคับ</p>
  </section>
  <section>
    <h2>5. ระยะเวลาเก็บข้อมูล</h2>
    <p>เราเก็บข้อมูลเท่าที่จำเป็นต่อวัตถุประสงค์และการใช้งานของระบบ โดยค่าเริ่มต้นเก็บเหตุการณ์ webhook 30 วัน ประวัติการส่ง 90 วัน audit log 365 วัน session ที่หมดอายุแล้วอีก 7 วัน และข้อมูล rate limit 2 วัน ผู้ดูแล deployment อาจปรับระยะเวลาเหล่านี้ได้ ส่วนข้อมูลบัญชี การตั้งค่าบอต และข้อมูลแชตจะเก็บตลอดเวลาที่จำเป็นต่อการให้บริการหรือจนกว่าจะมีคำขอลบและไม่มีหน้าที่ตามกฎหมายให้ต้องเก็บต่อ</p>
  </section>
  <section>
    <h2>6. การรักษาความปลอดภัย</h2>
    <p>เราใช้มาตรการตามความเหมาะสม เช่น การยืนยันลายเซ็น webhook, การจำกัดสิทธิ์ผู้ดูแล, การเก็บ token/API key เป็น hash เมื่อสามารถทำได้, การเข้ารหัส credential ของ LINE ขณะจัดเก็บ, การจำกัดอัตราการเรียก API และการบันทึก audit log อย่างไรก็ตาม ไม่มีระบบออนไลน์ใดรับประกันความปลอดภัยได้ทั้งหมด ผู้ดูแลต้องรักษาอุปกรณ์ บัญชี LINE และ credential ของตนให้ปลอดภัย</p>
  </section>
  <section>
    <h2>7. สิทธิของเจ้าของข้อมูล</h2>
    <p>ภายใต้กฎหมายที่ใช้บังคับ คุณอาจขอเข้าถึง รับสำเนา แก้ไข ลบ จำกัดหรือคัดค้านการประมวลผล ขอให้โอนข้อมูล ถอนความยินยอม หรือร้องเรียนต่อหน่วยงานกำกับดูแลได้ การถอนความยินยอมไม่กระทบการประมวลผลที่เกิดขึ้นโดยชอบก่อนถอน เราอาจขอข้อมูลเพื่อยืนยันตัวตนก่อนดำเนินการตามคำขอ</p>
  </section>
  <section>
    <h2>8. การจัดเก็บในอุปกรณ์</h2>
    <p>หน้า LIFF เก็บ local session token ไว้ใน local storage ของเบราว์เซอร์เพื่อยืนยันตัวตนและให้เข้าใช้งานต่อเนื่องเท่านั้น ไม่ได้นำไปใช้เพื่อโฆษณาหรือติดตามพฤติกรรมข้ามบริการ คุณสามารถลบข้อมูลเว็บไซต์หรือออกจากระบบเพื่อลบ token ดังกล่าวจากอุปกรณ์ได้</p>
  </section>
  <section>
    <h2>9. การเปลี่ยนแปลงและการติดต่อ</h2>
    <p>เราอาจแก้ไขนโยบายนี้เมื่อบริการหรือข้อกำหนดทางกฎหมายเปลี่ยนแปลง โดยจะแสดงวันที่ปรับปรุงล่าสุดไว้บนหน้านี้ หากต้องการใช้สิทธิหรือสอบถามเรื่องความเป็นส่วนตัว ติดต่อ ${OPERATOR_NAME} ที่ <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    <p class="note">อย่าส่ง Channel access token, Channel secret, API key, session token หรือข้อมูลส่วนบุคคลที่ไม่จำเป็นทางอีเมล</p>
  </section>
`

const termsContent = `
  <section>
    <h2>1. การยอมรับข้อกำหนด</h2>
    <p>เมื่อเข้าถึงหรือใช้ ${PRODUCT_NAME} คุณยืนยันว่าได้อ่าน เข้าใจ และยอมรับข้อกำหนดนี้กับนโยบายความเป็นส่วนตัว หากคุณดำเนินการแทนองค์กร คุณยืนยันว่ามีอำนาจผูกพันองค์กรนั้น หากไม่ยอมรับ โปรดหยุดใช้งานระบบ</p>
  </section>
  <section>
    <h2>2. ลักษณะบริการ</h2>
    <p>${PRODUCT_NAME} เป็นเครื่องมือจัดการ LINE Messaging API สำหรับเชื่อมต่อหลายบอต ตั้งค่าและทดสอบ webhook จัดการแชต ส่งข้อความ ดูโควตาและประวัติการทำงาน และออก API key ให้ระบบภายนอก ฟังก์ชันบางส่วนขึ้นอยู่กับบริการ สิทธิ์ โควตา และข้อจำกัดของ LINE</p>
  </section>
  <section>
    <h2>3. บัญชีและความปลอดภัย</h2>
    <ul>
      <li>คุณต้องให้ข้อมูลที่ถูกต้อง ใช้บัญชีและ LINE channel ที่ตนมีสิทธิ์จัดการ และรับผิดชอบกิจกรรมที่เกิดผ่านบัญชีของตน</li>
      <li>คุณต้องเก็บ Channel access token, Channel secret, API key และอุปกรณ์ที่เข้าใช้งานเป็นความลับ และแจ้งผู้ดูแลทันทีเมื่อสงสัยว่ามีการเข้าถึงโดยไม่ได้รับอนุญาต</li>
      <li>คุณต้องตั้งค่า recipient, webhook และข้อความให้ถูกต้องก่อนสั่งส่ง การออกจาก group หรือ room ผ่าน LINE อาจย้อนกลับด้วย API ไม่ได้</li>
    </ul>
  </section>
  <section>
    <h2>4. การใช้งานที่ยอมรับได้</h2>
    <p>คุณตกลงว่าจะไม่ใช้ระบบเพื่อส่งสแปม หลอกลวง คุกคาม ละเมิดสิทธิหรือกฎหมาย ส่งเนื้อหาที่เป็นอันตราย เก็บหรือใช้ข้อมูลโดยไม่มีฐานทางกฎหมาย พยายามเลี่ยงสิทธิ์หรือ rate limit รบกวนความมั่นคงของระบบ หรือเข้าถึงบัญชี แชต หรือข้อมูลที่ตนไม่ได้รับอนุญาต</p>
    <p>คุณรับผิดชอบต่อเนื้อหา รายชื่อผู้รับ ความยินยอม และการปฏิบัติตามกฎหมายคุ้มครองข้อมูล กฎหมายการสื่อสาร และ <a href="https://terms.line.me/line_terms?lang=th" rel="external noreferrer">ข้อกำหนดของ LINE</a> ที่เกี่ยวข้อง</p>
  </section>
  <section>
    <h2>5. ข้อมูลและเนื้อหาของคุณ</h2>
    <p>คุณยังคงมีสิทธิในเนื้อหาและข้อมูลที่คุณนำเข้าสู่ระบบ และอนุญาตให้เราประมวลผลข้อมูลดังกล่าวเท่าที่จำเป็นเพื่อให้บริการ คุณยืนยันว่ามีสิทธิหรือฐานทางกฎหมายเพียงพอในการนำข้อมูลมาใช้และสั่งให้ระบบส่งข้อความ โปรดอ่านรายละเอียดการประมวลผลในนโยบายความเป็นส่วนตัว</p>
  </section>
  <section>
    <h2>6. ซอฟต์แวร์และทรัพย์สินทางปัญญา</h2>
    <p>ซอร์สโค้ดของโครงการเผยแพร่ภายใต้ MIT License ตามไฟล์ LICENSE ของโครงการ เครื่องหมายการค้า โลโก้ และบริการของ LINE เป็นของเจ้าของสิทธิที่เกี่ยวข้อง และไม่ได้หมายความว่า LINE สนับสนุนหรือรับรอง ${PRODUCT_NAME}</p>
  </section>
  <section>
    <h2>7. บริการภายนอกและความพร้อมใช้งาน</h2>
    <p>บริการอาศัย LINE Platform, เครือข่าย, ฐานข้อมูล และโครงสร้างพื้นฐานภายนอก จึงอาจหยุดชะงัก เปลี่ยนแปลง หรือมีข้อจำกัดที่อยู่นอกการควบคุม เราอาจปรับปรุง ระงับ หรือยุติฟังก์ชันเพื่อบำรุงรักษา ความปลอดภัย การปฏิบัติตามกฎหมาย หรือการเปลี่ยนแปลงของผู้ให้บริการภายนอก</p>
  </section>
  <section>
    <h2>8. การปฏิเสธการรับประกันและความรับผิด</h2>
    <p>ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต บริการมีให้ตามสภาพและตามที่มีอยู่ โดยไม่รับประกันว่าจะทำงานต่อเนื่อง ปราศจากข้อผิดพลาด หรือเหมาะกับวัตถุประสงค์เฉพาะ คุณต้องตรวจสอบข้อความ ผู้รับ และผลการส่งก่อนนำไปใช้จริง</p>
    <p>ภายใต้ขอบเขตสูงสุดที่กฎหมายอนุญาต ผู้ให้บริการจะไม่รับผิดสำหรับความเสียหายทางอ้อม การสูญเสียกำไร ข้อมูล ชื่อเสียง หรือความเสียหายจาก LINE Platform, credential รั่วไหล, การตั้งค่าหรือคำสั่งที่ผิดพลาด ทั้งนี้ ไม่มีข้อความใดตัดสิทธิหรือความรับผิดที่กฎหมายห้ามจำกัด</p>
  </section>
  <section>
    <h2>9. การระงับหรือยุติการใช้งาน</h2>
    <p>เราอาจจำกัด ระงับ หรือยุติการเข้าถึงเมื่อมีเหตุอันควรเชื่อว่าคุณฝ่าฝืนข้อกำหนด ก่อความเสี่ยงต่อระบบหรือบุคคลอื่น หรือเมื่อจำเป็นตามกฎหมาย คุณสามารถหยุดใช้งานและถอนสิทธิของแอปได้จากรายการแอปที่ได้รับอนุญาตในการตั้งค่าบัญชี LINE การถอนสิทธิจะหยุดการเข้าถึงข้อมูล LINE ใหม่ แต่ไม่ลบข้อมูลที่จัดเก็บไว้บนเซิร์ฟเวอร์โดยอัตโนมัติ โปรดติดต่อผู้ดูแลเพื่อขอลบข้อมูลตามนโยบายความเป็นส่วนตัว</p>
  </section>
  <section>
    <h2>10. กฎหมายที่ใช้บังคับ การเปลี่ยนแปลง และการติดต่อ</h2>
    <p>ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย โดยไม่กระทบสิทธิที่กฎหมายคุ้มครองผู้ใช้กำหนดไว้เป็นอย่างอื่น เราอาจแก้ไขข้อกำหนดเมื่อบริการหรือกฎหมายเปลี่ยน และจะแสดงวันที่ปรับปรุงล่าสุดไว้บนหน้านี้ การใช้บริการต่อหลังข้อกำหนดใหม่มีผลถือเป็นการยอมรับข้อกำหนดที่แก้ไข</p>
    <p>หากมีคำถามเกี่ยวกับข้อกำหนด ติดต่อ ${OPERATOR_NAME} ที่ <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
  </section>
`

/**
 * @param {{ title: string, description: string, content: string, currentPath: string }} page
 */
const renderPage = ({ title, description, content, currentPath }) => `<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#064f2a">
  <link rel="canonical" href="${currentPath}">
  <title>${title} | ${PRODUCT_NAME}</title>
  <style>${styles}</style>
</head>
<body>
  <header class="shell">
    <a class="brand" href="/liff/" aria-label="${PRODUCT_NAME}">
      <span class="mark" aria-hidden="true">N</span>
      <span>${PRODUCT_NAME}</span>
    </a>
  </header>
  <main class="shell">
    <article>
      <div class="hero">
        <h1>${title}</h1>
        <p class="intro">${description}</p>
        <p class="updated">ปรับปรุงล่าสุด: ${LAST_UPDATED}</p>
      </div>
      <div class="content">${content}</div>
    </article>
  </main>
  <footer class="shell">
    <span>© 2019–2026 ${OPERATOR_NAME}</span>
    <nav aria-label="เอกสารทางกฎหมาย">
      <a href="/privacy-policy"${currentPath === '/privacy-policy' ? ' aria-current="page"' : ''}>นโยบายความเป็นส่วนตัว</a>
      <a href="/terms-of-use"${currentPath === '/terms-of-use' ? ' aria-current="page"' : ''}>ข้อกำหนดการใช้งาน</a>
    </nav>
  </footer>
</body>
</html>`

const responseHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
}

export const privacyPolicy = () => new Response(renderPage({
  title: 'นโยบายความเป็นส่วนตัว',
  description: `รายละเอียดการเก็บ ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลของ ${PRODUCT_NAME}`,
  content: privacyContent,
  currentPath: '/privacy-policy',
}), { headers: responseHeaders })

export const termsOfUse = () => new Response(renderPage({
  title: 'ข้อกำหนดการใช้งาน',
  description: `เงื่อนไขและความรับผิดชอบในการใช้บริการ ${PRODUCT_NAME}`,
  content: termsContent,
  currentPath: '/terms-of-use',
}), { headers: responseHeaders })
