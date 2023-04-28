const WorkExperienceTemplate = document.createElement("template");
WorkExperienceTemplate.innerHTML = `
    <link href='./portfolio/main.css' rel='stylesheet'>
    <style>
        #work-experience {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: center;
            align-content: center;
            row-gap: 30px;
        }

        #work-experience-container {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: center;
            align-content: center;
            row-gap: 30px;
        }

        .work-experience-item {
            display: flex;
            flex-direction: column;
            align-content: center;
            justify-content: center;
            align-items: flex-start;
            row-gap: 15px;
            padding: 20px 20px 15px 20px;
            border: 1.5px solid var(--color-primary);
            border-radius: 1rem;
            box-shadow: 0px 0px 10px -4px var(--color-secondary);
        }

        @media only screen and (max-width: 931px) {
            .work-experience-item {
                row-gap: 10px;
            }
        }

        .work-experience-item:hover {
            font-weight: var(--font-weight-hover);
            color: var(--color-bw_secondary);
            border: 1.5px solid var(--color-primary);
            background-color: var(--color-primary);
            box-shadow: 0px 0px 10px -4px var(--color-secondary);
        }

        .work-experience-item:hover .work-experience-divider {
            border-top: 1.5px dashed var(--color-bw_secondary);
        }

        .work-experience-item:hover app-label-with-icon::part(lwi_icon) {
            font-weight: var(--font-weight-hover);
            color: var(--color-bw_secondary);
        }

        .work-experience-item:hover app-label-with-icon::part(lwi_label) {
            font-weight: var(--font-weight-hover);
            color: var(--color-bw_secondary);
        }

        .work-experience-header {
            align-self: stretch;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            align-content: center;
            column-gap: 30px;
        }

        @media only screen and (max-width: 931px) {
            .work-experience-header {
                align-self: stretch;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-content: center;
                align-items: center;
                row-gap: 20px;
            }
        }

        .work-experience-organisation-logo-container {
            display: flex;
            align-self: stretch;
            justify-content: center;
            align-content: center;
            flex-direction: row;
            width: 100%;
            background-color: #ffffff;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0px 1px 8px -5px var(--color-bw_secondary_invert);

            max-height: 70px;
        }

        @media only screen and (max-width: 931px) {
            .work-experience-organisation-logo-container {
                width: unset;
                align-self: stretch;
                height: 70px;
                padding: 15px;
            }
        }

        .work-experience-organisation-logo {
            width: 100%;
            height: 100%;
        }

        .work-experience-details {
            align-self: stretch;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            grid-row-gap: 5px;
            grid-column-gap: 15px;
        }

        @media only screen and (max-width: 661px) {
            .work-experience-details {
                align-self: stretch;
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                grid-template-rows: repeat(4, 1fr);
                grid-row-gap: 5px;
                grid-column-gap: 15px;
            }
        }

        .work-experience-details app-label-with-icon::part(lwi) {
            min-width: 300px;
        }

        @media only screen and (max-width: 781px) {
            .work-experience-details app-label-with-icon::part(lwi) {
                min-width: fit-content;
            }
        }

        .work-experience-divider {
            align-self: stretch;
            margin: 0px;
            border: none;
            border-top: 1.5px dashed var(--color-bw_secondary_invert);
            height: 0px;
            background-color: transparent;
            flex: 1;
        }

        .work-experience-profile-details-item {
            align-self: stretch;
            grid-template-columns: repeat(1, 1fr);
            grid-row-gap: 10px;
            grid-column-gap: 15px;
        }

        .work-experience-profile-details-item-wrapper {
            align-self: stretch;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .work-experience-profile-details-left {
            width: 2rem;
        }

        .work-experience-profile-details-header {
            align-self: stretch;
            display: flex;
            flex-direction: column;
            gap: 0px;
        }

        @media only screen and (max-width: 661px) {
            .work-experience-profile-details-header {
                align-self: stretch;
                display: flex;
                flex-direction: column;
                gap: 0px;
            }
        }

        .work-experience-description {
            font-size: 16px;
            font-weight: normal;
        }

        .work-experience-description * {
            font-size: 16px;
            font-weight: normal;
        }

        .work-experience-description>* {
            margin: 0px;
        }

        .work-experience-profile {
            font-size: 18px;
        }

        .work-experience-date {
            font-size: 14px;
            font-weight: 100;

        }

        .work-experience-profile-details {
            position: relative;
            padding: 0;
            list-style: none;
            margin: 0;
        }

        .work-experience-profile-details>li {
            position: relative;
            margin-bottom: 1rem;
            padding-left: 2rem;
        }

        .work-experience-profile-details>li:only-child {
            margin-bottom: 0rem;
            padding-left: 0rem;
        }

        .work-experience-profile-details>li:only-child:before,
        .work-experience-profile-details>li:only-child:after {
            display: none;
        }

        .work-experience-profile-details>li:before {
            content: '';
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: transparent;
            border: 1.5px solid var(--color-bw_secondary_invert);
        }

        .work-experience-item:hover .work-experience-profile-details>li:before {
            border: 1.5px solid var(--color-bw_secondary);
        }

        .work-experience-profile-details>li:after {
            content: '';
            position: absolute;
            top: 1.15rem;
            left: 0.825rem;
            width: 1.25px;
            height: calc(100% + 0.4rem);
            background: var(--color-bw_secondary_invert);
        }

        .work-experience-item:hover .work-experience-profile-details>li:after {
            width: 1.25px;
            background: var(--color-bw_secondary);
        }

        .work-experience-profile-details>li:last-child {
            margin-bottom: 0;
        }

        .work-experience-profile-details>li:last-child:after {
            display: none;
        }
    </style>
    <div id="work-experience">
        <h3>Work Experience</h3>
    </div>
    <template id="work-experience-template">
        <div class="work-experience">
            <div class="work-experience-item">
                <div class="work-experience-header">
                    <div class="work-experience-organisation-logo-container">
                        <img class="work-experience-organisation-logo" src="" alt="" />
                    </div>
                    <div class="work-experience-details">
                        <app-label-with-icon
                            class="work-experience-organisation"
                            icon="fa fa-building-o"
                            icon_title="Work Organisation"
                            label=""
                        ></app-label-with-icon>
                        <app-label-with-icon
                            class="work-experience-location"
                            icon="fa fa-map-marker"
                            icon_title="Work Location"
                            label=""
                        ></app-label-with-icon>
                        <app-label-with-icon
                            class="work-experience-type"
                            icon="fa fa-tasks"
                            icon_title="Work Type"
                            label=""
                        ></app-label-with-icon>
                        <app-label-with-icon
                            class="work-experience-industry"
                            icon="fa fa-industry"
                            icon_title="Work Industry"
                            label=""
                        ></app-label-with-icon>
                    </div>
                </div>
                <hr class="work-experience-divider" />
                <ul class="work-experience-profile-details">
                    <li class="work-experience-profile-details-item">
                        <div class="work-experience-profile-details-item-wrapper">
                            <div class="work-experience-profile-details-header">
                                <div class="work-experience-profile"></div>
                                <div class="work-experience-date"></div>
                            </div>
                            <div class="work-experience-description"></div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </template>
`;

class AppWorkExperience extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(WorkExperienceTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const link = document.createElement("link");
    link.href = "https://baijudodhia.github.io/cdn/font-awesome-5.15.4/icons/all.min.css";
    link.rel = "stylesheet";
    this.shadowRoot.prepend(link);
  }

  static get observedAttributes() {
    return ["language"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "language" && oldValue !== newValue && newValue) {
      this.addSectionLoader();
      this.fetchWorkExperienceData(newValue);
    }
  }

  async fetchWorkExperienceData(language = "en") {
    const response = await fetch(`./portfolio/data/work-experience/${language}.work-experience.json`);
    const data = await response.json();
    this.loadWorkExperience(data.workExperience);
  }

  loadWorkExperience(data) {
    if ("content" in document.createElement("template")) {
      const workExperienceContainer = document.createElement("div");
      workExperienceContainer.id = "work-experience-container";
      workExperienceContainer.innerHTML = "";
      const workExperienceTemplate = this.shadowRoot.querySelector("#work-experience-template");

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const val = data[key];
          const clone = workExperienceTemplate.content.cloneNode(true);
          const company = val.company;

          clone.querySelector(".work-experience-organisation-logo").setAttribute("src", company.logo);
          clone.querySelector(".work-experience-organisation-logo").setAttribute("alt", company.name);
          clone.querySelector(".work-experience-organisation").setAttribute("label", company.name);
          clone.querySelector(".work-experience-location").setAttribute("label", company.location);
          clone.querySelector(".work-experience-industry").setAttribute("label", company.industry);
          clone.querySelector(".work-experience-type").setAttribute("label", company.domain);

          const profileDetails = clone.querySelector(".work-experience-profile-details").cloneNode(true);
          profileDetails.innerHTML = "";

          const positions = val.positions;
          for (let i = 0; i < positions.length; i++) {
            const position = positions[i];

            let profileDetailsItem = clone.querySelector(".work-experience-profile-details-item").cloneNode(true);
            profileDetailsItem.querySelector(".work-experience-profile").innerHTML = position["profile"];
            profileDetailsItem.querySelector(
              ".work-experience-date",
            ).innerHTML = `${position.fromDate} - ${position.toDate}`;
            profileDetailsItem.querySelector(".work-experience-description").innerHTML = position.description;

            profileDetails.appendChild(profileDetailsItem);
          }

          clone.querySelector(".work-experience-profile-details").innerHTML = profileDetails.innerHTML;

          workExperienceContainer.appendChild(clone);
        }
      }
      this.removeSectionLoader();
      this.shadowRoot.querySelector("#work-experience").appendChild(workExperienceContainer);
    }
  }

  addSectionLoader() {
    const sectionLoader = document.createElement("div");
    sectionLoader.setAttribute("class", "section-loader");

    const workExperience = this.shadowRoot.querySelector("#work-experience");
    workExperience.append(sectionLoader);
  }

  removeSectionLoader() {
    this.shadowRoot.querySelector(".section-loader")?.remove();
  }
}

customElements.define("app-work-experience", AppWorkExperience);