import React from "react";
import { Button, Wizard, WizardContextConsumer, WizardFooter } from "@patternfly/react-core";
import { defineMessages, FormattedMessage, injectIntl, intlShape } from "react-intl";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import NotificationsApi from "../../data/NotificationsApi";
import BlueprintApi from "../../data/BlueprintApi";
import { setBlueprint } from "../../core/actions/blueprints";
import { fetchingQueue, clearQueue, startCompose, fetchingComposeTypes } from "../../core/actions/composes";
import AWSAuthStep from "./AWSAuthStep";
import AWSDestinationStep from "./AWSDestinationStep";
import AzureAuthStep from "./AzureAuthStep";
import AzureDestinationStep from "./AzureDestinationStep";
import VMWareAuthStep from "./VMWareAuthStep";
import VMWareDestinationStep from "./VMWareDestinationStep";
import ReviewStep from "./ReviewStep";
import ImageStep from "./ImageStep";

const messages = defineMessages({
  title: {
    defaultMessage: "Create image",
  },
});

class CreateImageUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  open() {
    this.setState({ isOpen: true });
  }

  close() {
    this.setState({ isOpen: false });
  }

  render() {
    return (
      <>
        <Button id="create-image-button" variant="secondary" onClick={this.open}>
          <FormattedMessage defaultMessage="Create image" />
        </Button>
        {this.state.isOpen && <CreateImageUploadModal {...this.props} close={this.close} isOpen={this.state.isOpen} />}
      </>
    );
  }
}

class CreateImageUploadModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageType: "",
      imageName: "",
      imageSize: undefined,
      minImageSize: 0,
      maxImageSize: 2000,
      ostreeSettings: {
        parent: undefined,
        ref: undefined,
        url: undefined,
      },
      showUploadAwsStep: false,
      showUploadAzureStep: false,
      showReviewStep: false,
      uploadService: "",
      uploadSettings: {},
    };
    this.disableCreateButton = this.disableCreateButton.bind(this);
    this.getDefaultImageSize = this.getDefaultImageSize.bind(this);
    this.isPendingChange = this.isPendingChange.bind(this);
    this.isValidImageSize = this.isValidImageSize.bind(this);
    this.isValidOstree = this.isValidOstree.bind(this);
    this.isValidOstreeRef = this.isValidOstreeRef.bind(this);
    this.requiresImageSize = this.requiresImageSize.bind(this);
    this.missingRequiredFields = this.missingRequiredFields.bind(this);
    this.setNotifications = this.setNotifications.bind(this);
    this.setImageSize = this.setImageSize.bind(this);
    this.setImageName = this.setImageName.bind(this);
    this.setImageType = this.setImageType.bind(this);
    this.setOstreeParent = this.setOstreeParent.bind(this);
    this.setOstreeRef = this.setOstreeRef.bind(this);
    this.setOstreeURL = this.setOstreeURL.bind(this);
    this.setUploadSettings = this.setUploadSettings.bind(this);
    this.handleUploadService = this.handleUploadService.bind(this);
    this.handleCreateImage = this.handleCreateImage.bind(this);
    this.handleCommit = this.handleCommit.bind(this);
    this.handleStartCompose = this.handleStartCompose.bind(this);
    this.handleNextStep = this.handleNextStep.bind(this);
  }

  componentWillMount() {
    if (this.props.imageTypes.length === 0) {
      this.props.fetchingComposeTypes();
    }
    if (this.props.composeQueueFetched === false) {
      this.props.fetchingQueue();
    }
  }

  componentWillUnmount() {
    this.props.clearQueue();
  }

  handleUploadService(_, event) {
    const uploadService = event.target.value;
    const { checked } = event.target;
    if (!checked) {
      this.setState({
        uploadService: "",
        showUploadAwsStep: false,
        showUploadAzureStep: false,
        showReviewStep: false,
      });
    } else {
      switch (uploadService) {
        case "aws":
          this.setState({
            uploadService,
            uploadSettings: {
              accessKeyID: "",
              secretAccessKey: "",
              bucket: "",
              region: "",
            },
            showUploadAwsStep: true,
            showReviewStep: true,
          });
          break;
        case "azure":
          this.setState({
            uploadService,
            uploadSettings: {
              storageAccount: "",
              storageAccessKey: "",
              container: "",
            },
            showUploadAzureStep: true,
            showReviewStep: true,
          });
          break;
        case "vmware":
          this.setState({
            uploadService,
            uploadSettings: {
              username: "",
              password: "",
              host: "",
              cluster: "",
              dataCenter: "",
              dataStore: "",
            },
            showUploadVMWareStep: true,
            showReviewStep: true,
          });
          break;
        default:
          break;
      }
    }
  }

  handleCommit() {
    // clear existing notifications
    NotificationsApi.closeNotification(undefined, "committed");
    NotificationsApi.closeNotification(undefined, "committing");
    // display the committing notification
    NotificationsApi.displayNotification(this.props.blueprint.name, "committing");
    this.setNotifications();
    // post blueprint (includes 'committed' notification)
    Promise.all([BlueprintApi.handleCommitBlueprint(this.props.blueprint)])
      .then(() => {
        // then after blueprint is posted, reload blueprint details
        // to get details that were updated during commit (i.e. version)
        // and call create image
        Promise.all([BlueprintApi.reloadBlueprintDetails(this.props.blueprint)])
          .then((data) => {
            const blueprintToSet = { ...this.props.blueprint, version: data[0].version };
            this.props.setBlueprint(blueprintToSet);
            this.handleCreateImage();
          })
          .catch((e) => console.log(`Error in reload blueprint details: ${e}`));
      })
      .catch((e) => console.log(`Error in blueprint commit: ${e}`));
  }

  handleCreateImage() {
    NotificationsApi.displayNotification(this.props.blueprint.name, "imageWaiting");
    if (this.setNotifications) this.setNotifications();
    if (this.handleStartCompose)
      this.handleStartCompose(
        this.props.blueprint.name,
        this.state.imageType,
        this.state.imageName,
        this.state.imageSize,
        this.state.ostreeSettings,
        this.state.uploadService,
        this.state.uploadSettings
      );
    this.props.close();
  }

  handleStartCompose(blueprintName, composeType, imageName, imageSize, ostreeSettings, uploadService, uploadSettings) {
    const upload = {
      image_name: imageName,
      provider: uploadService,
      settings: uploadSettings,
    };

    let ostree;
    if (ostreeSettings.parent !== undefined || ostreeSettings.ref !== undefined || ostreeSettings.url !== undefined) {
      ostree = ostreeSettings;
    }

    if (uploadService === "") {
      this.props.startCompose(blueprintName, composeType, imageSize, ostree);
    } else {
      this.props.startCompose(blueprintName, composeType, imageSize, ostree, upload);
    }
  }

  handleNextStep(activeStepName, toNextStep) {
    if (activeStepName === "Review" || (activeStepName === "Image type" && this.state.uploadService.length === 0)) {
      if (this.isPendingChange()) this.handleCommit();
      else this.handleCreateImage();
    } else toNextStep();
  }

  setImageType(imageType) {
    const defaultImageSize = this.getDefaultImageSize(imageType);
    this.setState({
      imageType,
      imageName: "",
      imageSize: defaultImageSize,
      minImageSize: defaultImageSize,
      ostreeSettings: {
        parent: undefined,
        ref: undefined,
        url: undefined,
      },
      uploadService: "",
      uploadSettings: {},
      showUploadAwsStep: false,
      showUploadAzureStep: false,
      showUploadVMWareStep: false,
      showReviewStep: false,
    });
  }

  setNotifications() {
    this.props.layout.setNotifications();
  }

  setUploadSettings(_, event) {
    const key = event.target.name;
    const { value } = event.target;
    this.setState((prevState) => ({ uploadSettings: { ...prevState.uploadSettings, [key]: value } }));
  }

  setImageSize(value) {
    this.setState({
      imageSize: value || undefined,
    });
  }

  setImageName(value) {
    this.setState({
      imageName: value,
    });
  }

  setOstreeParent(value) {
    this.setState((prevState) => ({ ostreeSettings: { ...prevState.ostreeSettings, parent: value } }));
  }

  setOstreeRef(value) {
    this.setState((prevState) => ({ ostreeSettings: { ...prevState.ostreeSettings, ref: value } }));
  }

  setOstreeURL(value) {
    this.setState((prevState) => ({ ostreeSettings: { ...prevState.ostreeSettings, url: value } }));
  }

  getDefaultImageSize(imageType) {
    if (imageType === "ami") {
      return 6;
    }
    if (imageType === undefined) {
      return null;
    }
    return 2;
  }

  disableCreateButton(activeStepName) {
    if (this.state.imageType === "") return true;
    if (
      this.requiresImageSize(this.state.imageType) &&
      (this.state.imageSize === undefined || (!this.isValidImageSize() && this.state.uploadService === ""))
    ) {
      return true;
    }
    if (!this.isValidOstree()) return true;
    if (this.missingRequiredFields() && activeStepName === "Review") {
      return true;
    }
    return false;
  }

  missingRequiredFields() {
    if (this.state.uploadService.length === 0) return true;
    if (this.state.imageName.length === 0) return true;
    if (Object.values(this.state.uploadSettings).some((setting) => setting === "")) return true;
    for (const setting in this.state.uploadSettings) {
      if (this.state.uploadSettings[setting].length === 0) return true;
    }
    if (this.state.imageSize === undefined || this.state.imageSize < this.state.minImageSize) return true;
    return false;
  }

  requiresImageSize(imageType) {
    if (
      imageType === "" ||
      imageType === "fedora-iot-commit" ||
      imageType === "edge-commit" ||
      imageType === "edge-container" ||
      imageType === "edge-installer"
    ) {
      return false;
    }
    return true;
  }

  isPendingChange() {
    return (
      this.props.blueprint.workspacePendingChanges.length > 0 || this.props.blueprint.localPendingChanges.length > 0
    );
  }

  isValidImageSize() {
    if (this.state.imageSize !== undefined && this.state.imageSize < this.state.minImageSize) {
      return false;
    }
    return true;
  }

  isValidOstree() {
    if (this.state.ostreeSettings.parent && this.state.ostreeSettings.url) return false;
    if (this.state.imageType === "edge-installer" && !this.state.ostreeSettings.url) return false;
    return this.isValidOstreeRef(this.state.ostreeSettings.ref);
  }

  isValidOstreeRef(ref) {
    // eslint-disable-next-line max-len
    // This regex is based on https://github.com/ostreedev/ostree/blob/73742252e286e8b53677555dc1b0d52d55fb7012/src/libostree/ostree-core.c#L151
    const refValidationRegex = /^(?:[\w\d][-._\w\d]*\/)*[\w\d][-._\w\d]*$/;
    return ref === "" || refValidationRegex.test(ref);
  }

  render() {
    const { formatMessage } = this.props.intl;
    const { showUploadAwsStep, showUploadAzureStep, showUploadVMWareStep, showReviewStep, uploadService } = this.state;

    const imageStep = {
      name: <FormattedMessage defaultMessage="Image type" />,
      component: (
        <ImageStep
          blueprint={this.props.blueprint}
          handleUploadService={this.handleUploadService}
          imageName={this.state.imageName}
          imageSize={this.state.imageSize}
          imageType={this.state.imageType}
          imageTypes={this.props.imageTypes}
          isValidOstreeRef={this.isValidOstreeRef}
          isPendingChange={this.isPendingChange}
          minImageSize={this.state.minImageSize}
          maxImageSize={this.state.maxImageSize}
          ostreeSettings={this.state.ostreeSettings}
          requiresImageSize={this.requiresImageSize}
          setImageSize={this.setImageSize}
          setImageType={this.setImageType}
          setOstreeParent={this.setOstreeParent}
          setOstreeRef={this.setOstreeRef}
          setOstreeURL={this.setOstreeURL}
          uploadService={this.state.uploadService}
        />
      ),
    };

    const awsUploadAuth = {
      name: <FormattedMessage defaultMessage="Authentication" />,
      component: <AWSAuthStep uploadSettings={this.state.uploadSettings} setUploadSettings={this.setUploadSettings} />,
    };

    const awsUploadDest = {
      name: <FormattedMessage defaultMessage="Destination" />,
      component: (
        <AWSDestinationStep
          imageName={this.state.imageName}
          uploadSettings={this.state.uploadSettings}
          setImageName={this.setImageName}
          setUploadSettings={this.setUploadSettings}
        />
      ),
    };

    const awsUploadStep = {
      name: <FormattedMessage defaultMessage="Upload to AWS" />,
      steps: [awsUploadAuth, awsUploadDest],
    };

    const azureUploadAuth = {
      name: <FormattedMessage defaultMessage="Authentication" />,
      component: (
        <AzureAuthStep uploadSettings={this.state.uploadSettings} setUploadSettings={this.setUploadSettings} />
      ),
    };

    const azureUploadDest = {
      name: <FormattedMessage defaultMessage="Destination" />,
      component: (
        <AzureDestinationStep
          imageName={this.state.imageName}
          uploadSettings={this.state.uploadSettings}
          setImageName={this.setImageName}
          setUploadSettings={this.setUploadSettings}
        />
      ),
    };

    const azureUploadStep = {
      name: <FormattedMessage defaultMessage="Upload to Azure" />,
      steps: [azureUploadAuth, azureUploadDest],
    };

    const vmwareUploadAuth = {
      name: <FormattedMessage defaultMessage="Authentication" />,
      component: (
        <VMWareAuthStep uploadSettings={this.state.uploadSettings} setUploadSettings={this.setUploadSettings} />
      ),
    };

    const vmwareUploadDest = {
      name: <FormattedMessage defaultMessage="Destination" />,
      component: (
        <VMWareDestinationStep
          imageName={this.state.imageName}
          uploadSettings={this.state.uploadSettings}
          setImageName={this.setImageName}
          setUploadSettings={this.setUploadSettings}
        />
      ),
    };

    const vmwareUploadStep = {
      name: <FormattedMessage defaultMessage="Upload to VMWare" />,
      steps: [vmwareUploadAuth, vmwareUploadDest],
    };

    const reviewStep = {
      name: <FormattedMessage defaultMessage="Review" />,
      component: (
        <ReviewStep
          imageName={this.state.imageName}
          imageSize={this.state.imageSize}
          imageType={this.state.imageType}
          imageTypes={this.props.imageTypes}
          minImageSize={this.state.minImageSize}
          maxImageSize={this.state.maxImageSize}
          uploadService={this.state.uploadService}
          uploadSettings={this.state.uploadSettings}
          missingRequiredFields={this.missingRequiredFields}
        />
      ),
    };

    const steps = [
      imageStep,
      ...(showUploadAwsStep ? [awsUploadStep] : []),
      ...(showUploadAzureStep ? [azureUploadStep] : []),
      ...(showUploadVMWareStep ? [vmwareUploadStep] : []),
      ...(showReviewStep ? [reviewStep] : []),
    ];

    const createImageUploadFooter = (
      <WizardFooter>
        <WizardContextConsumer>
          {({ activeStep, onNext, onBack, onClose }) => {
            // The active step's name is translated so we need to use the default message
            const activeStepName = activeStep.name.props.defaultMessage;
            return (
              <>
                <Button
                  id="continue-button"
                  variant="primary"
                  isDisabled={this.disableCreateButton(activeStepName)}
                  onClick={() => this.handleNextStep(activeStepName, onNext)}
                >
                  {activeStepName === "Image type" ? (
                    uploadService.length > 0 ? (
                      this.isPendingChange() ? (
                        <FormattedMessage defaultMessage="Commit and next" />
                      ) : (
                        <FormattedMessage defaultMessage="Next" />
                      )
                    ) : this.isPendingChange() ? (
                      <FormattedMessage defaultMessage="Commit and create" />
                    ) : (
                      <FormattedMessage defaultMessage="Create" />
                    )
                  ) : activeStepName === "Review" ? (
                    <FormattedMessage defaultMessage="Finish" />
                  ) : (
                    <FormattedMessage defaultMessage="Next" />
                  )}
                </Button>
                <Button variant="secondary" onClick={onBack} isDisabled={activeStepName === "Image type"}>
                  <FormattedMessage defaultMessage="Back" />
                </Button>
                <Button id="cancel-button" variant="danger" onClick={onClose}>
                  <FormattedMessage defaultMessage="Cancel" />
                </Button>
              </>
            );
          }}
        </WizardContextConsumer>
      </WizardFooter>
    );

    return (
      <>
        <Wizard
          id="create-image-upload-wizard"
          isOpen={this.props.isOpen}
          onClose={this.props.close}
          footer={createImageUploadFooter}
          title={formatMessage(messages.title)}
          steps={steps}
        />
      </>
    );
  }
}

CreateImageUpload.propTypes = {
  blueprint: PropTypes.shape({
    changed: PropTypes.bool,
    description: PropTypes.string,
    groups: PropTypes.array,
    id: PropTypes.string,
    localPendingChanges: PropTypes.array,
    modules: PropTypes.array,
    name: PropTypes.string,
    packages: PropTypes.arrayOf(PropTypes.object),
    version: PropTypes.string,
    workspacePendingChanges: PropTypes.arrayOf(PropTypes.object),
  }),
  intl: intlShape.isRequired,
  layout: PropTypes.shape({
    setNotifications: PropTypes.func,
  }),
};

CreateImageUpload.defaultProps = {
  blueprint: {},
  layout: {},
};

CreateImageUploadModal.propTypes = {
  blueprint: PropTypes.shape({
    changed: PropTypes.bool,
    description: PropTypes.string,
    groups: PropTypes.array,
    id: PropTypes.string,
    localPendingChanges: PropTypes.array,
    modules: PropTypes.array,
    name: PropTypes.string,
    packages: PropTypes.arrayOf(PropTypes.object),
    version: PropTypes.string,
    workspacePendingChanges: PropTypes.arrayOf(PropTypes.object),
  }),
  composeQueueFetched: PropTypes.bool,
  fetchingQueue: PropTypes.func,
  clearQueue: PropTypes.func,
  imageTypes: PropTypes.arrayOf(PropTypes.object),
  fetchingComposeTypes: PropTypes.func,
  setBlueprint: PropTypes.func,
  intl: intlShape.isRequired,
  startCompose: PropTypes.func,
  layout: PropTypes.shape({
    setNotifications: PropTypes.func,
  }),
  close: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

CreateImageUploadModal.defaultProps = {
  blueprint: {},
  composeQueueFetched: true,
  fetchingQueue() {},
  clearQueue() {},
  imageTypes: [],
  fetchingComposeTypes() {},
  setBlueprint() {},
  startCompose() {},
  layout: {},
  isOpen: false,
};

const mapStateToProps = (state) => ({
  composeQueue: state.composes.queue,
  composeQueueFetched: state.composes.queueFetched,
  imageTypes: state.composes.composeTypes,
});

const mapDispatchToProps = (dispatch) => ({
  setBlueprint: (blueprint) => {
    dispatch(setBlueprint(blueprint));
  },
  fetchingComposeTypes: () => {
    dispatch(fetchingComposeTypes());
  },
  fetchingQueue: () => {
    dispatch(fetchingQueue());
  },
  clearQueue: () => {
    dispatch(clearQueue());
  },
  startCompose: (blueprintName, composeType, imageSize, ostree, upload) => {
    dispatch(startCompose(blueprintName, composeType, imageSize, ostree, upload));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(CreateImageUpload));
