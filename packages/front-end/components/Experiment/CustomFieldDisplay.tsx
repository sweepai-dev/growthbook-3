import React, { FC, useState } from "react";
import {
  CustomExperimentField,
  ExperimentInterfaceStringDates,
} from "back-end/types/experiment";
import { useForm } from "react-hook-form";
import { CustomField } from "back-end/types/organization";
import { useUser } from "@/services/UserContext";
import { useCustomFields } from "@/services/experiments";
import { useAuth } from "@/services/auth";
import PremiumTooltip from "@/components/Marketing/PremiumTooltip";
import HeaderWithEdit from "../Layout/HeaderWithEdit";
import Modal from "../Modal";
import CustomFieldInput from "./CustomFieldInput";

const CustomFieldDisplay: FC<{
  label?: string;
  canEdit?: boolean;
  mutate?: () => void;
  experiment: ExperimentInterfaceStringDates;
}> = ({ label = "Additional Fields", experiment, canEdit = true, mutate }) => {
  const [editModal, setEditModal] = useState(false);
  const customFields = useCustomFields();
  const customFieldsMap = new Map();
  const defaultFields: CustomExperimentField = {};
  if (customFields && customFields.length) {
    customFields.map((v) => {
      defaultFields[v.id] =
        v.type === "boolean"
          ? JSON.stringify("")
          : v.type === "multiselect"
          ? JSON.stringify([])
          : "";
      customFieldsMap.set(v.id, v);
    });
  }

  const { hasCommercialFeature } = useUser();
  const hasCustomFieldAccess = hasCommercialFeature("custom-exp-metadata");
  const form = useForm<Partial<ExperimentInterfaceStringDates>>({
    defaultValues: {
      customFields: experiment?.customFields || defaultFields,
    },
  });
  const { apiCall } = useAuth();

  if (customFields && customFields.length) {
    return (
      <>
        {editModal && (
          <Modal
            header={"Edit Custom Fields"}
            open={editModal}
            close={() => {
              setEditModal(false);
            }}
            size="lg"
            submit={form.handleSubmit(async (value) => {
              await apiCall(`/experiment/${experiment.id}`, {
                method: "POST",
                body: JSON.stringify({ ...value }),
              });

              if (mutate) mutate();
            })}
            cta="Save"
          >
            {hasCustomFieldAccess ? (
              <CustomFieldInput customFields={customFields} form={form} />
            ) : (
              <div className="text-center">
                <PremiumTooltip commercialFeature={"custom-exp-metadata"}>
                  Custom fields are available as part of the enterprise plan
                </PremiumTooltip>
              </div>
            )}
          </Modal>
        )}
        {label && (
          <HeaderWithEdit
            edit={
              canEdit &&
              hasCustomFieldAccess &&
              (() => {
                setEditModal(true);
              })
            }
            outerClassName="mb-3"
          >
            {label}
          </HeaderWithEdit>
        )}
        {experiment?.customFields && (
          <>
            {Array.from(customFieldsMap.values()).map((v: CustomField) => {
              // these two loops are used to make sure the order is correct with the stored order of custom fields.
              return Object.keys(experiment.customFields).map((fid, i) => {
                if (v.id === fid) {
                  const f = experiment.customFields[fid];
                  const displayValue =
                    v.type === "multiselect" ? JSON.parse(f).join(", ") : f;
                  if (displayValue) {
                    if (v.type === "textarea" || v.type === "markdown") {
                      return (
                        <div className="mb-4" key={i}>
                          <h4>{v.name}</h4>
                          {displayValue}
                        </div>
                      );
                    } else {
                      return (
                        <div className="mb-3" key={i}>
                          <span className="h4">{v.name}</span>
                          {": "}
                          {displayValue}
                        </div>
                      );
                    }
                  }
                }
              });
            })}
          </>
        )}
      </>
    );
  }
};

export default CustomFieldDisplay;
