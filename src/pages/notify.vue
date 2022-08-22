<template>
<div class="markdown-body readme py-5" >
  <h2>Notify LINE</h2>
  <ol>
    <li>Click menu <strong>"NOTIFY"</strong> and <strong>"CREATE"</strong> in LIFF menu.</li>
    <img src="~/assets/liff-notify-service.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-service" />
    <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank"><strong>"Add Service"</strong></a> and your need to fill all related info you need</li>
    <img src="~/assets/liff-notify-create.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-create" />
    <li>For <strong>"Service Site"</strong> and <strong>"Callback URL"</strong>, just fill arbitrary web site with <strong>"https://notice.touno.io/{service_name}"</strong> or copy <strong>No.3</strong> and put it to the topic.</li>
    <img src="~/assets/notify-service-add.webp" width="650" height="100%" class="mt-2 mb-4" alt="notify-service-add" />
    <li>Submit <strong>Agree and continue</strong> and check your mailbox becouse service you valid after click <strong>verify link</strong> in email.</li>
    <li>Remember you need <strong>"Client ID"</strong> and <strong>"Client Secret"</strong> for LIFF.</li>
    <img src="~/assets/liff-notify-create.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-create" />

    <li>After <strong>"Create Notify"</strong> and Click <strong>"Sure, Add now"</strong> then click <strong>{service_name}</strong> item your service and click <strong>join</strong></li>
    <img src="~/assets/liff-notify-room.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-room" />
    <li>Input <strong>{room_name}</strong> and click <strong>"Join Room"</strong></li>
    <img src="~/assets/liff-notify-join.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-join" />
    <li>Click this button and remember to login your Line account for authenication this notify.</li>
    <li>Select one on one notification, click <strong>"Agreed and Connected"</strong></li>
    <img src="~/assets/notify-service-join.webp" width="650" height="100%" class="mt-2 mb-4" alt="notify-service-join" />
    <li>Back to LIFF click your <strong>{room_name}</strong> and click <strong>Send "Testing Message"</strong></li>
    <img src="~/assets/liff-notify-example.webp" width="425" height="100%" class="mt-2 mb-4" alt="liff-notify-example" />
    <li>A notification will be sent to your chat room</li>
    <img src="~/assets/example-notify.webp" width="425" height="100%" class="mt-2 mb-4" alt="example-notify" />
    <li>Show that it's done</li>
  </ol>
</div>
</template>
<style lang="scss">
@media (max-width: 576px) {
  .readme {
    ol {
      > img {
        margin-left: -1em;
      }

      li {
        margin: 0 1em 0 -1em;

        > a.add-friend {
          display: block;
          padding: 0.3em 1em;
          margin: 0.5em 0;
        }
      }
    }
  }
}

.readme {
  img {
    border: #adadad solid 1px;
    padding: 1px;
  }
  code {
    font-size: 0.85rem;
  }
  .add-friend {
    display: inline-block;
    background-color: #00b900;
    border-radius: 1em;
    color: #fff;
    font-size: 1.2rem;
    font-weight: bold;
    padding: 0 1em;

    strong {
      margin-left: 1.3em;
      font-size: .9rem;
    }

    &::before {
      display: inherit;
      content: "";
      position: absolute;
      width: 22px;
      height: 22px;
      margin: 5px 0 0 -6px;
      background-image: url(~/assets/sp_160829.webp);
      background-size: cover;
    }

  }

}
</style>
