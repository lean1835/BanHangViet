package com.sales.modules.support.dto.response;
import com.sales.common.constant.SupportChannelType;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportChannelResponse {
    private String id;
    private SupportChannelType channelType;
    private String channelTypeDisplayName;
    private String channelName;
    private String contactValue;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
}
