// ============================================================
// EXCEED REALITY - APPLICATION SYSTEM
// applications.js
// ============================================================

const {
  SlashCommandBuilder,
  PermissionsBitField,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType
} = require('discord.js');


// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {

  applicationLogChannelId:
    process.env.APPLICATION_LOG_CHANNEL_ID ||
    '1553463830808367134',

  rosterCategoryId:
    process.env.ROSTER_APPLICATION_CATEGORY_ID ||
    '1544697294363037811',

  staffCategoryId:
    process.env.STAFF_APPLICATION_CATEGORY_ID ||
    '1544697296518774875',

  // How long a user has to answer each question.
  // 15 minutes.
  questionTimeout:
    15 * 60 * 1000,

  // Application embed color.
  color:
    0x009df5
};


// ============================================================
// APPLICATION QUESTIONS
// ============================================================

const APPLICATION_TYPES = {

  roster: {

    name:
      'Roster Application',

    emoji:
      '📋',

    categoryId:
      CONFIG.rosterCategoryId,

    questions: [

      'Please link your Fortnite Tracker or tell us your Epic Games username.',

      'Why do you want to join Exceed Reality?',

      'What roster are you applying for (Competitive, Token, Creative, or Content)?',

      'Where did you hear about Exceed Reality?',

      'Do you understand that any form of double rostering will result in immediate removal from our roster?'
    ]
  },


  staff: {

    name:
      'Staff Application',

    emoji:
      '💼',

    categoryId:
      CONFIG.staffCategoryId,

    questions: [

      'Please submit your resume link or list your experience (Organization + Role).',

      'Do you understand that Exceed Reality reserves the right to remove you from staff at all times when given a reason to?',

      'Why do you want to join Exceed Reality?',

      'Where did you hear about Exceed Reality?',

      'Two members are fighting in general channels, what is your first course of action?',

      'You see a staff abusing his/her power but they have higher roles than you, who do you report it to?',

      'When a person who opens a ticket is being disrespectful what will you say?',

      'Do you agree to remain professional at all times?',

      'Do you understand that any form of double rostering will result in staff role removal?',

      'What roles are you expecting to receive (Staff Roles, Management Roles, Operation Roles, High Authority Roles)?'
    ]
  }
};


// ============================================================
// STATE
// ============================================================

// Users currently filling out an application.
//
// Key:
// guildId:userId
//
// This prevents someone from starting several applications
// at the same time.

const activeApplications =
  new Map();


// Completed applications awaiting staff review.
//
// applicationId -> application data

const pendingApplications =
  new Map();


// Applications already accepted/declined.
// Prevents two staff members from processing the same app.

const processedApplications =
  new Set();


// ============================================================
// SLASH COMMANDS
// ============================================================

const applicationCommands = [

  new SlashCommandBuilder()
    .setName(
      'applicationspanel'
    )
    .setDescription(
      'Send the Exceed Reality application panel.'
    )
    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.Administrator
    )
];


// ============================================================
// HELPER - SAFE REPLY
// ============================================================

async function safeReply(
  interaction,
  payload
) {

  try {

    if (
      interaction.replied ||
      interaction.deferred
    ) {

      return await interaction.followUp(
        payload
      );
    }


    return await interaction.reply(
      payload
    );


  } catch (error) {

    console.error(
      '[Applications] Failed to reply:',
      error
    );


    return null;
  }
}


// ============================================================
// HELPER - SANITIZE CHANNEL NAME
// ============================================================

function sanitizeChannelName(
  value
) {

  return String(
    value || 'applicant'
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9-_]/g,
      '-'
    )
    .replace(
      /-+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    )
    .slice(
      0,
      70
    ) || 'applicant';
}


// ============================================================
// HELPER - APPLICATION ID
// ============================================================

function createApplicationId(
  guildId,
  userId
) {

  return (
    `${guildId}-` +
    `${userId}-` +
    `${Date.now()}`
  );
}


// ============================================================
// HELPER - ACTIVE APPLICATION KEY
// ============================================================

function getActiveKey(
  guildId,
  userId
) {

  return (
    `${guildId}:` +
    `${userId}`
  );
}


// ============================================================
// HELPER - APPLICATION TYPE
// ============================================================

function getApplicationType(
  type
) {

  return (
    APPLICATION_TYPES[type] ||
    null
  );
}


// ============================================================
// PANEL EMBED
// ============================================================

function createApplicationPanelEmbed() {

  return new EmbedBuilder()

    .setColor(
      CONFIG.color
    )

    .setTitle(
      '📨 Exceed Reality Applications'
    )

    .setDescription(
      '**Interested in joining Exceed Reality?**\n\n' +

      'Select the application you would like to complete using the dropdown below.\n\n' +

      '📋 **Roster Application**\n' +
      'Apply for the Competitive, Token, Creative, or Content roster.\n\n' +

      '💼 **Staff Application**\n' +
      'Apply to become a member of the Exceed Reality staff team.\n\n' +

      '**How applications work:**\n' +
      '• Select an application below.\n' +
      '• The application will be sent to your DMs.\n' +
      '• Answer every question honestly and completely.\n' +
      '• Your application will be submitted to Exceed Reality staff.\n' +
      '• If accepted, a private application ticket will automatically be created.\n\n' +

      '⚠️ **Make sure your DMs are enabled before beginning.**'
    )

    .setFooter({
      text:
        'Exceed Reality • Application System'
    })

    .setTimestamp();
}


// ============================================================
// PANEL DROPDOWN
// ============================================================

function createApplicationDropdown() {

  const menu =
    new StringSelectMenuBuilder()

      .setCustomId(
        'edr_application_select'
      )

      .setPlaceholder(
        'Select an application...'
      )

      .addOptions(

        new StringSelectMenuOptionBuilder()
          .setLabel(
            'Roster Application'
          )
          .setDescription(
            'Apply for an Exceed Reality roster.'
          )
          .setEmoji(
            '📋'
          )
          .setValue(
            'roster'
          ),


        new StringSelectMenuOptionBuilder()
          .setLabel(
            'Staff Application'
          )
          .setDescription(
            'Apply for the Exceed Reality staff team.'
          )
          .setEmoji(
            '💼'
          )
          .setValue(
            'staff'
          ),


        new StringSelectMenuOptionBuilder()
          .setLabel(
            'Cancel'
          )
          .setDescription(
            'Cancel your selection.'
          )
          .setEmoji(
            '❌'
          )
          .setValue(
            'cancel'
          )
      );


  return new ActionRowBuilder()
    .addComponents(
      menu
    );
}


// ============================================================
// SEND APPLICATION PANEL
// ============================================================

async function sendApplicationPanel(
  interaction
) {

  if (
    !interaction.memberPermissions?.has(
      PermissionsBitField.Flags.Administrator
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '❌ Only administrators can send the application panel.',

        ephemeral:
          true
      }
    );
  }


  await interaction.channel.send({

    embeds: [
      createApplicationPanelEmbed()
    ],

    components: [
      createApplicationDropdown()
    ]
  });


  return safeReply(
    interaction,
    {
      content:
        '✅ Application panel sent successfully.',

      ephemeral:
        true
    }
  );
}


// ============================================================
// DM QUESTION EMBED
// ============================================================

function createQuestionEmbed(
  application,
  question,
  number,
  total
) {

  return new EmbedBuilder()

    .setColor(
      CONFIG.color
    )

    .setTitle(
      `${application.emoji} ${application.name}`
    )

    .setDescription(
      `**Question ${number} of ${total}**\n\n` +
      `${question}\n\n` +
      'Reply to this DM with your answer.\n\n' +
      'Type **cancel** at any time to cancel your application.'
    )

    .setFooter({
      text:
        'Exceed Reality • Application System'
    })

    .setTimestamp();
}


// ============================================================
// WAIT FOR DM ANSWER
// ============================================================

async function waitForDMAnswer(
  dmChannel,
  userId
) {

  try {

    const collected =
      await dmChannel.awaitMessages({

        filter:
          message =>
            message.author.id ===
              userId &&
            !message.author.bot,

        max:
          1,

        time:
          CONFIG.questionTimeout,

        errors: [
          'time'
        ]
      });


    return (
      collected.first() ||
      null
    );


  } catch {

    return null;
  }
}


// ============================================================
// START APPLICATION
// ============================================================

async function startApplication(
  interaction,
  type
) {

  const application =
    getApplicationType(
      type
    );


  if (!application) {

    return safeReply(
      interaction,
      {
        content:
          '❌ Invalid application type.',

        ephemeral:
          true
      }
    );
  }


  const activeKey =
    getActiveKey(
      interaction.guild.id,
      interaction.user.id
    );


  if (
    activeApplications.has(
      activeKey
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '⚠️ You already have an application in progress. Check your DMs.',

        ephemeral:
          true
      }
    );
  }


  // ==========================================================
  // OPEN USER DM
  // ==========================================================

  let dmChannel;


  try {

    dmChannel =
      await interaction.user.createDM();


    await dmChannel.send({

      embeds: [

        new EmbedBuilder()

          .setColor(
            CONFIG.color
          )

          .setTitle(
            `${application.emoji} ${application.name}`
          )

          .setDescription(
            `Welcome to the **Exceed Reality ${application.name}**.\n\n` +

            `You will be asked **${application.questions.length} questions**.\n\n` +

            'Please answer each question honestly and completely.\n\n' +

            'You have **15 minutes per question**.\n\n' +

            'You can type **cancel** at any time to cancel your application.\n\n' +

            '**Your first question will be sent shortly.**'
          )

          .setFooter({
            text:
              'Exceed Reality • Application System'
          })

          .setTimestamp()
      ]
    });


  } catch (error) {

    console.error(
      '[Applications] Could not DM applicant:',
      error
    );


    return safeReply(
      interaction,
      {
        content:
          '❌ I could not send you a DM. Please enable DMs from server members and try again.',

        ephemeral:
          true
      }
    );
  }


  // ==========================================================
  // MARK APPLICATION ACTIVE
  // ==========================================================

  activeApplications.set(
    activeKey,
    {
      type,
      startedAt:
        Date.now()
    }
  );


  // Acknowledge panel interaction before collecting answers.

  await safeReply(
    interaction,
    {
      content:
        `📨 Your **${application.name}** has been sent to your DMs.`,

      ephemeral:
        true
    }
  );


  const answers = [];


  try {

    // ========================================================
    // ASK QUESTIONS ONE AT A TIME
    // ========================================================

    for (
      let i = 0;
      i < application.questions.length;
      i++
    ) {

      const question =
        application.questions[i];


      await dmChannel.send({

        embeds: [
          createQuestionEmbed(
            application,
            question,
            i + 1,
            application.questions.length
          )
        ]
      });


      const answerMessage =
        await waitForDMAnswer(
          dmChannel,
          interaction.user.id
        );


      // ======================================================
      // TIMEOUT
      // ======================================================

      if (!answerMessage) {

        await dmChannel.send({

          embeds: [

            new EmbedBuilder()

              .setColor(
                0xff9500
              )

              .setTitle(
                '⏰ Application Timed Out'
              )

              .setDescription(
                'Your application was canceled because no answer was received within 15 minutes.\n\n' +
                'You may return to the application panel and start again.'
              )

              .setTimestamp()
          ]
        });


        return;
      }


      const answer =
        answerMessage.content.trim();


      // ======================================================
      // CANCEL
      // ======================================================

      if (
        answer.toLowerCase() ===
        'cancel'
      ) {

        await dmChannel.send({

          embeds: [

            new EmbedBuilder()

              .setColor(
                0xff3b30
              )

              .setTitle(
                '❌ Application Canceled'
              )

              .setDescription(
                'Your application has been canceled.\n\n' +
                'No application was submitted.'
              )

              .setTimestamp()
          ]
        });


        return;
      }


      answers.push(
        answer
      );


      await dmChannel.send(
        `✅ **Answer ${i + 1}/${application.questions.length} saved.**`
      );
    }


    // ========================================================
    // CREATE APPLICATION DATA
    // ========================================================

    const applicationId =
      createApplicationId(
        interaction.guild.id,
        interaction.user.id
      );


    const data = {

      id:
        applicationId,

      type,

      guildId:
        interaction.guild.id,

      userId:
        interaction.user.id,

      username:
        interaction.user.username,

      userTag:
        interaction.user.tag,

      questions:
        [
          ...application.questions
        ],

      answers,

      submittedAt:
        Date.now(),

      status:
        'pending',

      logMessageId:
        null
    };


    pendingApplications.set(
      applicationId,
      data
    );


    // ========================================================
    // SEND APPLICATION TO LOGS
    // ========================================================

    const logged =
      await sendApplicationToLogs(
        interaction.guild,
        data
      );


    if (!logged) {

      pendingApplications.delete(
        applicationId
      );


      await dmChannel.send({

        embeds: [

          new EmbedBuilder()

            .setColor(
              0xff3b30
            )

            .setTitle(
              '❌ Application Submission Error'
            )

            .setDescription(
              'Your answers were completed, but the application could not be submitted to the staff review channel.\n\n' +
              'Please contact an Exceed Reality administrator.'
            )

            .setTimestamp()
        ]
      });


      return;
    }


    // ========================================================
    // CONFIRM SUBMISSION
    // ========================================================

    await dmChannel.send({

      embeds: [

        new EmbedBuilder()

          .setColor(
            0x36c96b
          )

          .setTitle(
            '✅ Application Submitted'
          )

          .setDescription(
            `Your **${application.name}** has been submitted successfully.\n\n` +

            'The Exceed Reality team will review your application.\n\n' +

            '**No ticket has been created yet.**\n' +

            'If your application is accepted, a private ticket will automatically be created and you will receive the ticket link here in your DMs.'
          )

          .setFooter({
            text:
              'Exceed Reality • Application System'
          })

          .setTimestamp()
      ]
    });


  } catch (error) {

    console.error(
      '[Applications] Application error:',
      error
    );


    try {

      await dmChannel.send(
        '❌ Something went wrong while processing your application. Please try again later.'
      );

    } catch {}
  }


  finally {

    activeApplications.delete(
      activeKey
    );
  }
}


// ============================================================
// SPLIT APPLICATION ANSWERS INTO EMBEDS
// ============================================================

function createApplicationLogEmbeds(
  data
) {

  const application =
    getApplicationType(
      data.type
    );


  const embeds = [];


  let embed =
    new EmbedBuilder()

      .setColor(
        CONFIG.color
      )

      .setTitle(
        `${application.emoji} New ${application.name}`
      )

      .setDescription(
        `A new **${application.name}** has been submitted and is awaiting review.`
      )

      .addFields(
        {
          name:
            'Applicant',

          value:
            `<@${data.userId}>\n` +
            `\`${data.userId}\``
        },

        {
          name:
            'Application Type',

          value:
            application.name
        },

        {
          name:
            'Status',

          value:
            '🟡 Pending Review'
        }
      )

      .setFooter({
        text:
          `Application ID: ${data.id}`
      })

      .setTimestamp(
        data.submittedAt
      );


  let fieldsInEmbed =
    3;


  for (
    let i = 0;
    i < data.questions.length;
    i++
  ) {

    const question =
      data.questions[i];


    const answer =
      data.answers[i] ||
      'No answer provided.';


    // Discord allows 25 fields per embed,
    // but keep these smaller and easier to read.

    if (
      fieldsInEmbed >=
      10
    ) {

      embeds.push(
        embed
      );


      embed =
        new EmbedBuilder()

          .setColor(
            CONFIG.color
          )

          .setTitle(
            `${application.emoji} ${application.name} — Continued`
          )

          .setFooter({
            text:
              `Application ID: ${data.id}`
          });


      fieldsInEmbed =
        0;
    }


    embed.addFields({

      name:
        `${i + 1}. ${question}`.slice(
          0,
          256
        ),

      value:
        String(
          answer
        ).slice(
          0,
          1024
        )
    });


    fieldsInEmbed++;
  }


  embeds.push(
    embed
  );


  return embeds;
}


// ============================================================
// APPLICATION REVIEW BUTTONS
// ============================================================

function createReviewButtons(
  applicationId,
  disabled = false
) {

  const accept =
    new ButtonBuilder()

      .setCustomId(
        `edr_app_accept:${applicationId}`
      )

      .setLabel(
        'Accept'
      )

      .setEmoji(
        '✅'
      )

      .setStyle(
        ButtonStyle.Success
      )

      .setDisabled(
        disabled
      );


  const decline =
    new ButtonBuilder()

      .setCustomId(
        `edr_app_decline:${applicationId}`
      )

      .setLabel(
        'Decline'
      )

      .setEmoji(
        '❌'
      )

      .setStyle(
        ButtonStyle.Danger
      )

      .setDisabled(
        disabled
      );


  return new ActionRowBuilder()
    .addComponents(
      accept,
      decline
    );
}


// ============================================================
// SEND APPLICATION TO LOG CHANNEL
// ============================================================

async function sendApplicationToLogs(
  guild,
  data
) {

  try {

    let channel =
      guild.channels.cache.get(
        CONFIG.applicationLogChannelId
      );


    if (!channel) {

      channel =
        await guild.channels
          .fetch(
            CONFIG.applicationLogChannelId
          )
          .catch(
            () => null
          );
    }


    if (
      !channel ||
      !channel.isTextBased()
    ) {

      console.error(
        '[Applications] Application log channel could not be found.'
      );


      return false;
    }


    const message =
      await channel.send({

        embeds:
          createApplicationLogEmbeds(
            data
          ),

        components: [
          createReviewButtons(
            data.id
          )
        ]
      });


    data.logMessageId =
      message.id;


    return true;


  } catch (error) {

    console.error(
      '[Applications] Failed to send application log:',
      error
    );


    return false;
  }
}


// ============================================================
// CHECK REVIEWER PERMISSIONS
// ============================================================

function canReviewApplications(
  interaction
) {

  if (
    !interaction.memberPermissions
  ) {

    return false;
  }


  return (
    interaction.memberPermissions.has(
      PermissionsBitField.Flags.Administrator
    ) ||
    interaction.memberPermissions.has(
      PermissionsBitField.Flags.ManageGuild
    ) ||
    interaction.memberPermissions.has(
      PermissionsBitField.Flags.ManageChannels
    )
  );
}


// ============================================================
// CREATE ACCEPTED APPLICATION TICKET
// ============================================================

async function createAcceptedTicket(
  guild,
  data,
  reviewer
) {

  const application =
    getApplicationType(
      data.type
    );


  if (!application) {

    throw new Error(
      'Unknown application type.'
    );
  }


  const applicant =
    await guild.members
      .fetch(
        data.userId
      )
      .catch(
        () => null
      );


  if (!applicant) {

    throw new Error(
      'Applicant is no longer in the server.'
    );
  }


  // ==========================================================
  // VERIFY CATEGORY
  // ==========================================================

  const category =
    await guild.channels
      .fetch(
        application.categoryId
      )
      .catch(
        () => null
      );


  if (
    !category ||
    category.type !==
      ChannelType.GuildCategory
  ) {

    throw new Error(
      `Application category ${application.categoryId} could not be found.`
    );
  }


  // ==========================================================
  // CHANNEL NAME
  // ==========================================================

  const username =
    sanitizeChannelName(
      applicant.user.username
    );


  const channelName =
    data.type === 'roster'
      ? `roster-${username}`
      : `staff-${username}`;


  // ==========================================================
  // CREATE PRIVATE TICKET
  // ==========================================================

  const channel =
    await guild.channels.create({

      name:
        channelName,

      type:
        ChannelType.GuildText,

      parent:
        application.categoryId,

      topic:
        `EDR-APPLICATION|applicant=${data.userId}|type=${data.type}|application=${data.id}|acceptedBy=${reviewer.id}`,

      permissionOverwrites: [

        // @everyone
        {
          id:
            guild.id,

          deny: [
            PermissionFlagsBits.ViewChannel
          ]
        },


        // Applicant
        {
          id:
            applicant.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        },


        // Bot
        {
          id:
            guild.members.me.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ],

      reason:
        `${application.name} accepted by ${reviewer.tag}`
    });


  // ==========================================================
  // APPLICATION INFORMATION
  // ==========================================================

  const introEmbed =
    new EmbedBuilder()

      .setColor(
        0x36c96b
      )

      .setTitle(
        `✅ Accepted ${application.name}`
      )

      .setDescription(
        `${applicant}, your **${application.name}** has been accepted!\n\n` +

        'This private channel has been created so you can continue the application/onboarding process with the Exceed Reality team.'
      )

      .addFields(
        {
          name:
            'Applicant',

          value:
            `${applicant}\n\`${applicant.id}\``,

          inline:
            true
        },

        {
          name:
            'Accepted By',

          value:
            `${reviewer}\n\`${reviewer.id}\``,

          inline:
            true
        },

        {
          name:
            'Application Type',

          value:
            application.name,

          inline:
            true
        }
      )

      .setFooter({
        text:
          'Exceed Reality • Application System'
      })

      .setTimestamp();


  await channel.send({

    content:
      `${applicant}`,

    embeds: [
      introEmbed
    ],

    allowedMentions: {
      users: [
        applicant.id
      ]
    }
  });


  // ==========================================================
  // POST APPLICATION ANSWERS INTO TICKET
  // ==========================================================

  const answerEmbeds =
    createTicketApplicationEmbeds(
      data
    );


  await channel.send({
    embeds:
      answerEmbeds
  });


  return channel;
}


// ============================================================
// APPLICATION ANSWERS FOR TICKET
// ============================================================

function createTicketApplicationEmbeds(
  data
) {

  const application =
    getApplicationType(
      data.type
    );


  const embeds = [];


  let embed =
    new EmbedBuilder()

      .setColor(
        CONFIG.color
      )

      .setTitle(
        `${application.emoji} ${application.name} Answers`
      )

      .setDescription(
        `<@${data.userId}>'s submitted application answers.`
      );


  let fields =
    0;


  for (
    let i = 0;
    i < data.questions.length;
    i++
  ) {

    if (
      fields >=
      10
    ) {

      embeds.push(
        embed
      );


      embed =
        new EmbedBuilder()

          .setColor(
            CONFIG.color
          )

          .setTitle(
            `${application.emoji} Application Answers — Continued`
          );


      fields =
        0;
    }


    embed.addFields({

      name:
        `${i + 1}. ${data.questions[i]}`.slice(
          0,
          256
        ),

      value:
        String(
          data.answers[i] ||
          'No answer provided.'
        ).slice(
          0,
          1024
        )
    });


    fields++;
  }


  embeds.push(
    embed
  );


  return embeds;
}


// ============================================================
// DISABLE REVIEW BUTTONS
// ============================================================

async function disableReviewButtons(
  interaction
) {

  try {

    await interaction.message.edit({

      components: [
        createReviewButtons(
          interaction.customId.split(':')[1],
          true
        )
      ]
    });


  } catch (error) {

    console.error(
      '[Applications] Failed to disable review buttons:',
      error
    );
  }
}


// ============================================================
// ACCEPT APPLICATION
// ============================================================

async function acceptApplication(
  interaction,
  applicationId
) {

  if (
    !canReviewApplications(
      interaction
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '❌ You do not have permission to review applications.',

        ephemeral:
          true
      }
    );
  }


  if (
    processedApplications.has(
      applicationId
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '⚠️ This application has already been processed.',

        ephemeral:
          true
      }
    );
  }


  const data =
    pendingApplications.get(
      applicationId
    );


  if (!data) {

    return safeReply(
      interaction,
      {
        content:
          '❌ The application data could not be found. If the bot restarted after this application was submitted, the in-memory application data may have been cleared.',

        ephemeral:
          true
      }
    );
  }


  // Mark as processing immediately to stop
  // two reviewers from accepting at once.

  processedApplications.add(
    applicationId
  );


  await interaction.deferReply({
    ephemeral:
      true
  });


  try {

    // ========================================================
    // CREATE TICKET
    // ========================================================

    const ticket =
      await createAcceptedTicket(
        interaction.guild,
        data,
        interaction.user
      );


    const ticketLink =
      `https://discord.com/channels/${interaction.guild.id}/${ticket.id}`;


    data.status =
      'accepted';


    data.reviewedBy =
      interaction.user.id;


    data.reviewedAt =
      Date.now();


    data.ticketChannelId =
      ticket.id;


    // ========================================================
    // DM APPLICANT
    // ========================================================

    const user =
      await interaction.client.users
        .fetch(
          data.userId
        )
        .catch(
          () => null
        );


    let dmSent =
      false;


    if (user) {

      dmSent =
        await user.send({

          embeds: [

            new EmbedBuilder()

              .setColor(
                0x36c96b
              )

              .setTitle(
                '✅ Exceed Reality Application Accepted'
              )

              .setDescription(
                `Congratulations! Your **${getApplicationType(data.type).name}** has been accepted.\n\n` +

                'A private application ticket has been opened for you.\n\n' +

                `**Your Ticket:** ${ticket}\n` +
                `[Open Your Application Ticket](${ticketLink})\n\n` +

                'Please continue the process with the Exceed Reality team in your ticket.'
              )

              .setFooter({
                text:
                  'Exceed Reality • Application System'
              })

              .setTimestamp()
          ]
        })
        .then(
          () => true
        )
        .catch(
          () => false
        );
    }


    // ========================================================
    // UPDATE REVIEW LOG
    // ========================================================

    await disableReviewButtons(
      interaction
    );


    await interaction.message.reply({

      embeds: [

        new EmbedBuilder()

          .setColor(
            0x36c96b
          )

          .setTitle(
            '✅ Application Accepted'
          )

          .setDescription(
            `<@${data.userId}>'s application was accepted.`
          )

          .addFields(
            {
              name:
                'Accepted By',

              value:
                `${interaction.user}\n\`${interaction.user.id}\``,

              inline:
                true
            },

            {
              name:
                'Ticket',

              value:
                `${ticket}\n[Open Ticket](${ticketLink})`,

              inline:
                true
            },

            {
              name:
                'Applicant DM',

              value:
                dmSent
                  ? '✅ Sent'
                  : '⚠️ Could not DM applicant',

              inline:
                true
            }
          )

          .setTimestamp()
      ]
    });


    pendingApplications.delete(
      applicationId
    );


    return interaction.editReply({
      content:
        `✅ Application accepted successfully.\n\nTicket: ${ticket}`
    });


  } catch (error) {

    // Allow staff to try again if ticket creation failed.

    processedApplications.delete(
      applicationId
    );


    console.error(
      '[Applications] Accept error:',
      error
    );


    return interaction.editReply({
      content:
        `❌ The application could not be accepted.\n\n\`${String(
          error.message ||
          error
        ).slice(
          0,
          1500
        )}\``
    });
  }
}


// ============================================================
// DECLINE APPLICATION
// ============================================================

async function declineApplication(
  interaction,
  applicationId
) {

  if (
    !canReviewApplications(
      interaction
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '❌ You do not have permission to review applications.',

        ephemeral:
          true
      }
    );
  }


  if (
    processedApplications.has(
      applicationId
    )
  ) {

    return safeReply(
      interaction,
      {
        content:
          '⚠️ This application has already been processed.',

        ephemeral:
          true
      }
    );
  }


  const data =
    pendingApplications.get(
      applicationId
    );


  if (!data) {

    return safeReply(
      interaction,
      {
        content:
          '❌ The application data could not be found. If the bot restarted after this application was submitted, the in-memory application data may have been cleared.',

        ephemeral:
          true
      }
    );
  }


  processedApplications.add(
    applicationId
  );


  await interaction.deferReply({
    ephemeral:
      true
  });


  try {

    data.status =
      'declined';


    data.reviewedBy =
      interaction.user.id;


    data.reviewedAt =
      Date.now();


    // ========================================================
    // DM APPLICANT
    // ========================================================

    const user =
      await interaction.client.users
        .fetch(
          data.userId
        )
        .catch(
          () => null
        );


    let dmSent =
      false;


    if (user) {

      dmSent =
        await user.send({

          embeds: [

            new EmbedBuilder()

              .setColor(
                0xff3b30
              )

              .setTitle(
                '❌ Exceed Reality Application Declined'
              )

              .setDescription(
                `Thank you for taking the time to submit your **${getApplicationType(data.type).name}**.\n\n` +

                'Unfortunately, your application has been **declined**.\n\n' +

                'If you would like to discuss the decision further, please open a **Support Ticket** in the Exceed Reality Discord server.'
              )

              .setFooter({
                text:
                  'Exceed Reality • Application System'
              })

              .setTimestamp()
          ]
        })
        .then(
          () => true
        )
        .catch(
          () => false
        );
    }


    // ========================================================
    // DISABLE BUTTONS
    // ========================================================

    await disableReviewButtons(
      interaction
    );


    // ========================================================
    // LOG DECISION
    // ========================================================

    await interaction.message.reply({

      embeds: [

        new EmbedBuilder()

          .setColor(
            0xff3b30
          )

          .setTitle(
            '❌ Application Declined'
          )

          .setDescription(
            `<@${data.userId}>'s application was declined.`
          )

          .addFields(
            {
              name:
                'Declined By',

              value:
                `${interaction.user}\n\`${interaction.user.id}\``,

              inline:
                true
            },

            {
              name:
                'Applicant DM',

              value:
                dmSent
                  ? '✅ Sent'
                  : '⚠️ Could not DM applicant',

              inline:
                true
            },

            {
              name:
                'Ticket Created',

              value:
                'No',

              inline:
                true
            }
          )

          .setTimestamp()
      ]
    });


    pendingApplications.delete(
      applicationId
    );


    return interaction.editReply({
      content:
        '✅ Application declined successfully.'
    });


  } catch (error) {

    processedApplications.delete(
      applicationId
    );


    console.error(
      '[Applications] Decline error:',
      error
    );


    return interaction.editReply({
      content:
        '❌ Something went wrong while declining this application.'
    });
  }
}


// ============================================================
// HANDLE DROPDOWN
// ============================================================

async function handleApplicationDropdown(
  interaction
) {

  const type =
    interaction.values[0];


  if (
    type ===
    'cancel'
  ) {

    return safeReply(
      interaction,
      {
        content:
          '❌ Application selection canceled.',

        ephemeral:
          true
      }
    );
  }


  return startApplication(
    interaction,
    type
  );
}


// ============================================================
// HANDLE REVIEW BUTTON
// ============================================================

async function handleReviewButton(
  interaction
) {

  const [
    action,
    applicationId
  ] =
    interaction.customId.split(
      ':'
    );


  if (
    !applicationId
  ) {

    return safeReply(
      interaction,
      {
        content:
          '❌ Invalid application ID.',

        ephemeral:
          true
      }
    );
  }


  if (
    action ===
    'edr_app_accept'
  ) {

    return acceptApplication(
      interaction,
      applicationId
    );
  }


  if (
    action ===
    'edr_app_decline'
  ) {

    return declineApplication(
      interaction,
      applicationId
    );
  }
}


// ============================================================
// SETUP APPLICATION SYSTEM
// ============================================================

function setupApplicationSystem(
  client
) {

  console.log(
    '[Applications] Loading Exceed Reality application system...'
  );


  // ==========================================================
  // INTERACTIONS
  // ==========================================================

  client.on(
    'interactionCreate',

    async interaction => {

      try {

        // ====================================================
        // /APPLICATIONSPANEL
        // ====================================================

        if (
          interaction.isChatInputCommand() &&
          interaction.commandName ===
            'applicationspanel'
        ) {

          return sendApplicationPanel(
            interaction
          );
        }


        // ====================================================
        // APPLICATION DROPDOWN
        // ====================================================

        if (
          interaction.isStringSelectMenu() &&
          interaction.customId ===
            'edr_application_select'
        ) {

          return handleApplicationDropdown(
            interaction
          );
        }


        // ====================================================
        // ACCEPT / DECLINE BUTTONS
        // ====================================================

        if (
          interaction.isButton() &&
          (
            interaction.customId.startsWith(
              'edr_app_accept:'
            ) ||
            interaction.customId.startsWith(
              'edr_app_decline:'
            )
          )
        ) {

          return handleReviewButton(
            interaction
          );
        }


      } catch (error) {

        console.error(
          '[Applications] Interaction error:',
          error
        );


        try {

          await safeReply(
            interaction,
            {
              content:
                '❌ Something went wrong with the application system.',

              ephemeral:
                true
            }
          );


        } catch {}
      }
    }
  );


  // ==========================================================
  // READY
  // ==========================================================

  client.once(
    'clientReady',

    () => {

      console.log(
        '[Applications] Application system ready.'
      );


      console.log(
        `[Applications] Log channel: ${CONFIG.applicationLogChannelId}`
      );


      console.log(
        `[Applications] Roster category: ${CONFIG.rosterCategoryId}`
      );


      console.log(
        `[Applications] Staff category: ${CONFIG.staffCategoryId}`
      );


      console.log(
        `[Applications] Roster questions: ${APPLICATION_TYPES.roster.questions.length}`
      );


      console.log(
        `[Applications] Staff questions: ${APPLICATION_TYPES.staff.questions.length}`
      );
    }
  );
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  setupApplicationSystem,
  applicationCommands
};
