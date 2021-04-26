import React from "react";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  InputGroup,
  InputGroupText,
  Popover,
  Text,
  TextInput,
} from "@patternfly/react-core";
import {
  ExternalLinkSquareAltIcon,
  ExclamationTriangleIcon,
  OutlinedQuestionCircleIcon,
} from "@patternfly/react-icons";
import { FormattedMessage, defineMessages, injectIntl, intlShape } from "react-intl";
import PropTypes from "prop-types";

const ariaLabels = defineMessages({
  uploadImage: {
    defaultMessage: "Upload image help",
  },
  processLength: {
    defaultMessage: "Process length help",
  },
  imageSize: {
    defaultMessage: "Image size help",
  },
  ostreeParent: {
    defaultMessage: "OSTree parent help",
  },
  ostreeRef: {
    defaultMessage: "OSTree ref help",
  },
  ostreeURL: {
    defaultMessage: "OSTree repo url help",
  },
});

const messages = defineMessages({
  imageSizePopover: {
    defaultMessage:
      "Set the size that you want the image to be when instantiated. " +
      "The total package size and target destination of your image should be considered when setting the image size.",
  },
  infotip: {
    defaultMessage: "This process can take a while. " + "Images are built in the order they are started.",
  },
  ostreeRefHelperText: {
    defaultMessage:
      "Valid characters for ref are letters from a to z, the digits from 0 to 9, the hyphen (-), the underscore (_), the period (.), " +
      "and the forward slash (/). A ref must start with a letter, a number, or an underscore. Slashes must also be followed by a letter or number.",
  },
  requiredField: {
    defaultMessage: "This is a required field",
  },
  type: {
    defaultMessage: "Type",
  },
  warningUnsaved: {
    defaultMessage:
      "This blueprint has changes that are not committed. " +
      "These changes will be committed before the image is created.",
  },
  warningEmptyBlueprint: {
    id: "empty-blueprint-alert",
    defaultMessage: "This blueprint is empty.",
  },
  warningEmptyBlueprintDesc: {
    defaultMessage: "A minimal image will be created with only the packages needed to support the selected image type.",
  },
  selectOne: {
    defaultMessage: "Select one",
  },
  warningSizeSmall: {
    defaultMessage: "Minimum size is {size} GB",
  },
  warningSizeLarge: {
    defaultMessage:
      "The size specified is large. We recommend that you check whether your target destination has any restrictions on image size.",
  },
  uploadAWS: {
    defaultMessage: "Upload to AWS",
  },
  uploadAzure: {
    defaultMessage: "Upload to Azure",
  },
  uploadVMWare: {
    defaultMessage: "Upload to VMWare",
  },
  labelqcow: {
    defaultMessage: "QEMU Image (.qcow2)",
  },
  labelTar: {
    defaultMessage: "Disk Archive (.tar)",
  },
  labelLiveIso: {
    defaultMessage: "Installer, suitable for USB and DVD (.iso)",
  },
});

class ImageStep extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      imageSizeValidated: "default",
      imageSizeHelperTextInvalid: "",
      ostreeRefValidated: "default",
    };
    this.handleImageTypeSelect = this.handleImageTypeSelect.bind(this);
    this.handleImageSizeInput = this.handleImageSizeInput.bind(this);
    this.handleOSTreeRef = this.handleOSTreeRef.bind(this);
    this.handleOSTreeCommit = this.handleOSTreeCommit.bind(this);
    this.handleOSTreeURL = this.handleOSTreeURL.bind(this);
  }

  handleImageTypeSelect(imageType) {
    this.setState({
      imageSizeValidated: "default",
      imageSizeHelperTextInvalid: "",
      ostreeRefValidated: "default",
      ostreeCommitValidated: "default",
      ostreeURLValidated: "default",
    });
    this.props.setImageType(imageType);
  }

  handleImageSizeInput(imageSize) {
    imageSize = Number(imageSize);
    if (imageSize === 0) {
      this.setState({
        imageSizeHelperTextInvalid: this.props.intl.formatMessage(messages.requiredField),
        imageSizeValidated: "error",
      });
    } else if (imageSize < this.props.minImageSize) {
      this.setState({
        imageSizeHelperTextInvalid: this.props.intl.formatMessage(messages.warningSizeSmall, {
          size: this.props.minImageSize,
        }),
        imageSizeValidated: "error",
      });
    } else if (imageSize > this.props.maxImageSize) {
      this.setState({
        imageSizeValidated: "warning",
      });
    } else {
      this.setState({
        imageSizeHelperTextInvalid: "",
        imageSizeValidated: "success",
      });
    }
    this.props.setImageSize(imageSize);
  }

  handleOSTreeRef(ref) {
    if (ref === "") {
      this.setState({
        ostreeRefValidated: "default",
      });
    } else if (this.props.isValidOstreeRef(ref)) {
      this.setState({
        ostreeRefValidated: "success",
      });
    } else {
      this.setState({
        ostreeRefValidated: "error",
      });
    }
    this.props.setOstreeRef(ref);
  }

  handleOSTreeCommit(commit) {
    if (!commit) {
      this.setState({
        ostreeURLValidated: "default",
      });
    }
    if (this.props.ostreeSettings.url && commit) {
      this.setState({
        ostreeCommitValidated: "error",
      });
    } else {
      this.setState({
        ostreeCommitValidated: "default",
      });
    }
    this.props.setOstreeParent(commit);
  }

  handleOSTreeURL(url) {
    if (!url) {
      this.setState({
        ostreeCommitValidated: "default",
      });
    }
    if (this.props.ostreeSettings.parent && url) {
      this.setState({
        ostreeURLValidated: "error",
      });
    } else {
      this.setState({
        ostreeURLValidated: "default",
      });
    }
    this.props.setOstreeURL(url);
  }

  render() {
    const { formatMessage } = this.props.intl;
    const {
      blueprint,
      handleUploadService,
      imageSize,
      imageType,
      imageTypes,
      isPendingChange,
      minImageSize,
      maxImageSize,
      ostreeSettings,
      requiresImageSize,
      uploadService,
    } = this.props;

    const {
      imageSizeValidated,
      imageSizeHelperTextInvalid,
      ostreeRefValidated,
      ostreeCommitValidated,
      ostreeURLValidated,
    } = this.state;

    const awsProviderCheckbox = (
      <FormGroup
        label={<FormattedMessage defaultMessage="Upload image" />}
        labelIcon={
          <Popover
            id="aws-provider-popover"
            bodyContent={
              <div>
                <p>
                  <FormattedMessage
                    defaultMessage="
                        Image Builder can upload images you create to an {bucket} in AWS and then import them into EC2. When the image build is complete
                        and the upload action is successful, the image file is available in the AMI section of EC2. Most of the values required to upload
                        the image can be found in the {console}.
                      "
                    values={{
                      bucket: "S3 bucket",
                      console: (
                        <Button
                          component="a"
                          className="pf-icon"
                          target="_blank"
                          variant="link"
                          icon={<ExternalLinkSquareAltIcon />}
                          iconPosition="right"
                          isInline
                          href="https://console.aws.amazon.com/console/home"
                        >
                          AWS Management Console
                        </Button>
                      ),
                    }}
                  />
                </p>
                <br />
                <p>
                  <FormattedMessage
                    defaultMessage="
                        This upload process requires that you have an {iam} role named {vmimport} to ensure that the image can
                        be imported from the S3 {bucket} into EC2. For more details, refer to the {role}.
                      "
                    values={{
                      bucket: "bucket",
                      vmimport: <code>vmimport</code>,
                      iam: "Identity and Access Management (IAM)",
                      role: (
                        <Button
                          component="a"
                          className="pf-icon"
                          target="_blank"
                          variant="link"
                          icon={<ExternalLinkSquareAltIcon />}
                          iconPosition="right"
                          isInline
                          href="https://docs.aws.amazon.com/vm-import/latest/userguide/vmie_prereqs.html#vmimport-role"
                        >
                          AWS Required Service Role
                        </Button>
                      ),
                    }}
                  />
                </p>
              </div>
            }
            aria-label={formatMessage(ariaLabels.uploadImage)}
          >
            <Button variant="plain" aria-label={formatMessage(ariaLabels.uploadImage)}>
              <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
            </Button>
          </Popover>
        }
        fieldId="aws-checkbox"
        hasNoPaddingTop
      >
        <Checkbox
          value="aws"
          isChecked={uploadService === "aws"}
          onChange={handleUploadService}
          label={formatMessage(messages.uploadAWS)}
          id="aws-checkbox"
        />
      </FormGroup>
    );

    const azureProviderCheckbox = (
      <FormGroup
        label={<FormattedMessage defaultMessage="Upload image" />}
        labelIcon={
          <Popover
            id="popover-help"
            bodyContent={
              <FormattedMessage
                defaultMessage="
                      Image Builder can upload images you create to a Blob container in {azure}. When the image build is complete
                      and the upload action is successful, the image file is available in the Storage account and Blob container that you specified.
                      "
                values={{
                  azure: (
                    <Button
                      component="a"
                      className="pf-icon"
                      target="_blank"
                      variant="link"
                      icon={<ExternalLinkSquareAltIcon />}
                      iconPosition="right"
                      isInline
                      href="https://portal.azure.com/"
                    >
                      Microsoft Azure
                    </Button>
                  ),
                }}
              />
            }
            aria-label={formatMessage(ariaLabels.uploadImage)}
          >
            <Button variant="plain" aria-label={formatMessage(ariaLabels.uploadImage)}>
              <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
            </Button>
          </Popover>
        }
        fieldId="azure-checkbox"
        hasNoPaddingTop
      >
        <Checkbox
          value="azure"
          isChecked={uploadService === "azure"}
          onChange={handleUploadService}
          label={formatMessage(messages.uploadAzure)}
          id="azure-checkbox"
        />
      </FormGroup>
    );

    const vmwareProviderCheckbox = (
      <FormGroup
        label={<FormattedMessage defaultMessage="Upload image" />}
        labelIcon={
          <Popover
            id="popover-help"
            bodyContent={
              <FormattedMessage
                defaultMessage="
                      Image Builder can upload images you create to VMWare vSphere.
                      When the image build is complete and the upload action is successful,
                      the image file is available in the Cluster on the vSphere instance that you specified.
                      "
              />
            }
            aria-label={formatMessage(ariaLabels.uploadImage)}
          >
            <Button variant="plain" aria-label={formatMessage(ariaLabels.uploadImage)}>
              <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
            </Button>
          </Popover>
        }
        fieldId="vmware-checkbox"
        hasNoPaddingTop
      >
        <Checkbox
          value="vmware"
          isChecked={uploadService === "vmware"}
          onChange={handleUploadService}
          label={formatMessage(messages.uploadVMWare)}
          id="vmware-checkbox"
        />
      </FormGroup>
    );

    const imageSizeInput = (
      <FormGroup
        label={<FormattedMessage defaultMessage="Image size" />}
        labelIcon={
          <Popover
            id="size-popover"
            bodyContent={formatMessage(messages.imageSizePopover)}
            aria-label={formatMessage(ariaLabels.imageSize)}
          >
            <Button variant="plain" aria-label={formatMessage(ariaLabels.imageSize)}>
              <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
            </Button>
          </Popover>
        }
        fieldId="image-size-input"
        hasNoPaddingTop
        helperText={
          imageSizeValidated === "warning"
            ? formatMessage(messages.warningSizeLarge)
            : formatMessage(messages.warningSizeSmall, {
                size: this.props.minImageSize,
              })
        }
        helperTextIcon={
          imageSizeValidated === "warning" ? <ExclamationTriangleIcon className="cc-c-text__align-icon" /> : ""
        }
        helperTextInvalid={imageSizeHelperTextInvalid}
        isRequired
        validated={imageSizeValidated}
      >
        <InputGroup>
          <TextInput
            className="pf-c-form-control"
            id="image-size-input"
            aria-describedby="image-size-input-helper"
            type="number"
            min={minImageSize}
            max={maxImageSize}
            value={imageSize || ""}
            validated={imageSizeValidated}
            onChange={this.handleImageSizeInput}
            isRequired
          />
          <InputGroupText>GB</InputGroupText>
        </InputGroup>
      </FormGroup>
    );

    const ostreeFields = (
      <>
        <FormGroup
          label={<FormattedMessage defaultMessage="Repository URL" />}
          labelIcon={
            <Popover
              id="ostree-url-popover"
              bodyContent={
                <FormattedMessage defaultMessage="Provide the URL of the upstream repository. This repository is where the parent OSTree commit will be pulled from." />
              }
              aria-label={formatMessage(ariaLabels.ostreeURL)}
            >
              <Button variant="plain" aria-label={formatMessage(ariaLabels.ostreeURL)}>
                <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
              </Button>
            </Popover>
          }
          fieldId="ostree-url-input"
          validated={ostreeURLValidated}
          hasNoPaddingTop
        >
          <TextInput
            className="pf-c-form-control"
            value={ostreeSettings.url !== undefined ? ostreeSettings.url : ""}
            type="text"
            id="ostree-url-input"
            onChange={this.handleOSTreeURL}
            validated={ostreeURLValidated}
          />
          {ostreeURLValidated === "error" && (
            <p className="pf-c-form__helper-text pf-m-error" id="ostree-url-input-helper-error" aria-live="polite">
              <FormattedMessage defaultMessage="Either the parent commit or repository url can be specified. Not both." />
            </p>
          )}
        </FormGroup>
        <FormGroup
          label={<FormattedMessage defaultMessage="Parent commit" />}
          labelIcon={
            <Popover
              id="ostree-parent-popover"
              bodyContent={
                <FormattedMessage
                  defaultMessage="
                    Provide the ID of the latest commit in the updates repository for which this commit provides an update.
                    If no commit is specified it will be inferred from the parent repository."
                />
              }
              aria-label={formatMessage(ariaLabels.ostreeParent)}
            >
              <Button variant="plain" aria-label={formatMessage(ariaLabels.ostreeParent)}>
                <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
              </Button>
            </Popover>
          }
          fieldId="ostree-parent-input"
          validated={ostreeCommitValidated}
          hasNoPaddingTop
        >
          <TextInput
            className="pf-c-form-control"
            value={ostreeSettings.parent !== undefined ? ostreeSettings.parent : ""}
            type="text"
            id="ostree-parent-input"
            onChange={this.handleOSTreeCommit}
            validated={ostreeCommitValidated}
          />
          {ostreeCommitValidated === "error" && (
            <p className="pf-c-form__helper-text pf-m-error" id="ostree-parent-input-helper-error" aria-live="polite">
              <FormattedMessage defaultMessage="Either the parent commit or repository url can be specified. Not both." />
            </p>
          )}
        </FormGroup>
        <FormGroup
          label={<FormattedMessage defaultMessage="Ref" />}
          labelIcon={
            <Popover
              id="ostree-ref-popover"
              bodyContent={
                <FormattedMessage defaultMessage="Provide the name of the branch for the content. If the ref does not already exist it will be created." />
              }
              aria-label={formatMessage(ariaLabels.ostreeRef)}
            >
              <Button variant="plain" aria-label={formatMessage(ariaLabels.ostreeRef)}>
                <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
              </Button>
            </Popover>
          }
          fieldId="ostree-ref-input"
          helperText={formatMessage(messages.ostreeRefHelperText)}
          helperTextInvalid={formatMessage(messages.ostreeRefHelperText)}
          validated={ostreeRefValidated}
          hasNoPaddingTop
        >
          <TextInput
            className="pf-c-form-control"
            value={ostreeSettings.ref !== undefined ? ostreeSettings.ref : ""}
            type="text"
            id="ostree-ref-input"
            aria-describedby="ostree-ref-input-helper-default ostree-ref-input-helper"
            onChange={this.handleOSTreeRef}
            validated={ostreeRefValidated}
          />
          {ostreeRefValidated === "default" && imageType === "edge-commit" && (
            <p className="pf-c-form__helper-text" id="ostree-ref-input-helper-default" aria-live="polite">
              <FormattedMessage
                defaultMessage="rhel/8/{arch}/edge is the default, where {arch} is determined by the host machine"
                values={{
                  arch: <em>$ARCH</em>,
                }}
              />
            </p>
          )}
        </FormGroup>
      </>
    );

    const ostreeInstallerFields = (
      <>
        <FormGroup
          label={<FormattedMessage defaultMessage="Repository URL" />}
          labelIcon={
            <Popover
              id="ostree-url-popover"
              bodyContent={
                <FormattedMessage defaultMessage="Provide the URL of the upstream repository. This repository is where the parent OSTree commit will be pulled from." />
              }
              aria-label={formatMessage(ariaLabels.ostreeURL)}
            >
              <Button variant="plain" aria-label={formatMessage(ariaLabels.ostreeURL)}>
                <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
              </Button>
            </Popover>
          }
          fieldId="ostree-url-input"
          helperTextInvalid={formatMessage(messages.requiredField)}
          validated={ostreeSettings.url !== "" ? "default" : "error"}
          isRequired
          hasNoPaddingTop
        >
          <TextInput
            className="pf-c-form-control"
            value={ostreeSettings.url !== undefined ? ostreeSettings.url : ""}
            type="text"
            id="ostree-url-input"
            onChange={this.handleOSTreeURL}
            validated={ostreeSettings.url !== "" ? "default" : "error"}
          />
        </FormGroup>
        <FormGroup
          label={<FormattedMessage defaultMessage="Ref" />}
          labelIcon={
            <Popover
              id="ostree-ref-popover"
              bodyContent={
                <FormattedMessage defaultMessage="Provide the name of the branch for the content. If the ref does not already exist it will be created." />
              }
              aria-label={formatMessage(ariaLabels.ostreeRef)}
            >
              <Button variant="plain" aria-label={formatMessage(ariaLabels.ostreeRef)}>
                <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
              </Button>
            </Popover>
          }
          fieldId="ostree-ref-input"
          helperText={formatMessage(messages.ostreeRefHelperText)}
          helperTextInvalid={formatMessage(messages.ostreeRefHelperText)}
          validated={ostreeRefValidated}
          hasNoPaddingTop
        >
          <TextInput
            className="pf-c-form-control"
            value={ostreeSettings.ref !== undefined ? ostreeSettings.ref : ""}
            type="text"
            id="ostree-ref-input"
            aria-describedby="ostree-ref-input-helper-default ostree-ref-input-helper"
            onChange={this.handleOSTreeRef}
            validated={ostreeRefValidated}
          />
          {ostreeRefValidated === "default" && imageType === "edge-installer" && (
            <p className="pf-c-form__helper-text" id="ostree-ref-input-helper-default" aria-live="polite">
              <FormattedMessage
                defaultMessage="rhel/8/{arch}/edge is the default, where {arch} is determined by the host machine"
                values={{
                  arch: <em>$ARCH</em>,
                }}
              />
            </p>
          )}
        </FormGroup>
      </>
    );

    return (
      <>
        {isPendingChange() && (
          <Alert id="pending-changes-alert" variant="warning" isInline title={formatMessage(messages.warningUnsaved)} />
        )}
        {blueprint.packages.length === 0 && (
          <Alert
            id="empty-blueprint-alert"
            variant="info"
            isInline
            title={formatMessage(messages.warningEmptyBlueprint)}
          >
            {formatMessage(messages.warningEmptyBlueprintDesc)}
          </Alert>
        )}
        <Form isHorizontal className="cc-m-wide-label">
          <FormGroup label={<FormattedMessage defaultMessage="Blueprint" />} fieldId="blueprint-name" hasNoPaddingTop>
            <div className="cc-c-popover__horizontal-group">
              <Text id="blueprint-name">{blueprint.name}</Text>
              <Popover
                id="blueprint-name-popover"
                bodyContent={formatMessage(messages.infotip)}
                aria-label={formatMessage(ariaLabels.processLength)}
              >
                <Button variant="plain" aria-label={formatMessage(ariaLabels.processLength)}>
                  <OutlinedQuestionCircleIcon className="cc-c-text__align-icon" id="popover-icon" />
                </Button>
              </Popover>
            </div>
          </FormGroup>
          <FormGroup label={formatMessage(messages.type)} fieldId="image-type" isRequired>
            <FormSelect value={imageType} id="image-type" onChange={this.handleImageTypeSelect} isRequired>
              <FormSelectOption isDisabled key="default" value="" label={formatMessage(messages.selectOne)} />
              {imageTypes.map(
                (type) =>
                  (type.name === "tar" && (
                    <FormSelectOption
                      isDisabled={!type.enabled}
                      key={type.name}
                      value={type.name}
                      label={formatMessage(messages.labelTar)}
                    />
                  )) ||
                  (type.name === "qcow2" && (
                    <FormSelectOption
                      isDisabled={!type.enabled}
                      key={type.name}
                      value={type.name}
                      label={formatMessage(messages.labelqcow)}
                    />
                  )) ||
                  (type.name === "live-iso" && (
                    <FormSelectOption
                      isDisabled={!type.enabled}
                      key={type.name}
                      value={type.name}
                      label={formatMessage(messages.labelLiveIso)}
                    />
                  )) || (
                    <FormSelectOption isDisabled={!type.enabled} key={type.name} value={type.name} label={type.label} />
                  )
              )}
            </FormSelect>
          </FormGroup>
          {imageType === "ami" && awsProviderCheckbox}
          {imageType === "vhd" && azureProviderCheckbox}
          {imageType === "vmdk" && vmwareProviderCheckbox}
          {requiresImageSize(imageType) && imageSizeInput}
          {(imageType === "fedora-iot-commit" || imageType === "edge-commit") && ostreeFields}
          {imageType === "edge-container" && ostreeFields}
          {imageType === "edge-installer" && ostreeInstallerFields}
        </Form>
      </>
    );
  }
}

ImageStep.propTypes = {
  blueprint: PropTypes.object,
  handleUploadService: PropTypes.func,
  intl: intlShape.isRequired,
  imageType: PropTypes.string,
  imageTypes: PropTypes.arrayOf(PropTypes.object),
  imageSize: PropTypes.number,
  isValidOstreeRef: PropTypes.func,
  isPendingChange: PropTypes.func,
  minImageSize: PropTypes.number,
  maxImageSize: PropTypes.number,
  ostreeSettings: PropTypes.object,
  requiresImageSize: PropTypes.func,
  setImageSize: PropTypes.func,
  setImageType: PropTypes.func,
  setOstreeParent: PropTypes.func,
  setOstreeRef: PropTypes.func,
  setOstreeURL: PropTypes.func,
  uploadService: PropTypes.string,
};

ImageStep.defaultProps = {
  blueprint: {},
  handleUploadService() {},
  imageType: "",
  imageTypes: [],
  imageSize: undefined,
  isValidOstreeRef() {},
  isPendingChange() {},
  minImageSize: 0,
  maxImageSize: 2000,
  ostreeSettings: {},
  requiresImageSize() {},
  setImageSize() {},
  setImageType() {},
  setOstreeParent() {},
  setOstreeRef() {},
  setOstreeURL() {},
  uploadService: "",
};

export default injectIntl(ImageStep);
